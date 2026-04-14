/**
 * Push notification setup for Serva mobile.
 *
 * Registers the device's Expo push token and saves it to the user's
 * push_tokens row so the backend can send reminders + updates.
 *
 * Call registerForPushNotifications() after the user signs in.
 * Actual notification sending happens from the server in Phase 8.
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(userId: string) {
  if (!Device.isDevice) {
    // Push notifications only work on physical devices
    return { token: null, error: 'Not a physical device' };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return { token: null, error: 'Permission denied' };
  }

  try {
    const tokenResp = await Notifications.getExpoPushTokenAsync();
    const token = tokenResp.data;

    // Save to push_tokens table (upsert on token)
    await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        token,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
      },
      { onConflict: 'token' },
    );

    return { token, error: null };
  } catch (err) {
    return {
      token: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

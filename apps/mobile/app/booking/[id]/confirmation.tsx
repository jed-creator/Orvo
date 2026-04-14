import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ServaTheme } from '@/constants/serva-theme';

interface BookingConfirm {
  id: string;
  start_time: string;
  total_cents: number;
  status: string;
  service: { name: string } | null;
  business: { name: string } | null;
}

export default function BookingConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingConfirm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('bookings')
        .select(
          'id, start_time, total_cents, status, service:services(name), business:businesses(name)',
        )
        .eq('id', id)
        .maybeSingle();
      setBooking(data as unknown as BookingConfirm);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={ServaTheme.accent} />
      </SafeAreaView>
    );
  }
  if (!booking) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Booking not found.</Text>
      </SafeAreaView>
    );
  }

  const fmt = new Date(booking.start_time).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
        <Text style={styles.title}>Booking requested</Text>
        <Text style={styles.subtitle}>
          {booking.business?.name} will confirm your booking shortly. You&apos;ll
          receive an email once they do.
        </Text>

        <View style={styles.card}>
          <Row label="Service" value={booking.service?.name ?? '—'} />
          <Row label="Business" value={booking.business?.name ?? '—'} />
          <Row label="When" value={fmt} />
          <Row
            label="Total"
            value={`$${(booking.total_cents / 100).toFixed(2)}`}
          />
          <Row label="Status" value={booking.status} />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(tabs)/bookings')}
        >
          <Text style={styles.buttonText}>View my bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondary]}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={[styles.buttonText, styles.secondaryText]}>
            Back to home
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ServaTheme.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ServaTheme.background,
  },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  checkmark: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ServaTheme.success + '22',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  checkmarkText: { fontSize: 44, color: ServaTheme.success },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: ServaTheme.foreground,
    textAlign: 'center',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: ServaTheme.mutedForeground,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  card: {
    backgroundColor: ServaTheme.muted,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 13, color: ServaTheme.mutedForeground },
  rowValue: {
    fontSize: 14,
    fontWeight: '500',
    color: ServaTheme.foreground,
    textTransform: 'capitalize',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  button: {
    height: 52,
    backgroundColor: ServaTheme.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: ServaTheme.border,
  },
  buttonText: {
    color: ServaTheme.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryText: { color: ServaTheme.foreground },
});

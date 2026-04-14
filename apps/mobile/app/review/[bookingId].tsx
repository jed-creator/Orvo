import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { ServaTheme } from '@/constants/serva-theme';

interface BookingInfo {
  id: string;
  business_id: string;
  consumer_id: string;
  business: { name: string } | null;
  service: { name: string } | null;
}

export default function WriteReviewScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    (async () => {
      const { data } = await supabase
        .from('bookings')
        .select(
          'id, business_id, consumer_id, business:businesses(name), service:services(name)',
        )
        .eq('id', bookingId)
        .maybeSingle();
      setBooking(data as unknown as BookingInfo);
      setLoading(false);
    })();
  }, [bookingId]);

  const handleSubmit = async () => {
    if (!booking || !user) return;
    setError(null);
    setSubmitting(true);
    const { error: err } = await supabase.from('reviews').insert({
      booking_id: booking.id,
      business_id: booking.business_id,
      consumer_id: user.id,
      rating,
      comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.replace('/(tabs)/bookings');
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Write review' }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.title}>How was your visit?</Text>
          <Text style={styles.subtitle}>
            {booking.service?.name} at {booking.business?.name}
          </Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)}>
                <Text style={[styles.star, n <= rating && styles.starActive]}>
                  ★
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Your review</Text>
          <TextInput
            style={styles.textarea}
            value={comment}
            onChangeText={setComment}
            placeholder="Tell other customers what you thought…"
            placeholderTextColor="#a1a1aa"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.button, submitting && styles.disabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={ServaTheme.primaryForeground} />
            ) : (
              <Text style={styles.buttonText}>Submit review</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ServaTheme.background },
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ServaTheme.background,
  },
  content: { padding: 24, flex: 1 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: ServaTheme.foreground,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: ServaTheme.mutedForeground,
    textAlign: 'center',
    marginTop: 6,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 32,
  },
  star: { fontSize: 48, color: ServaTheme.border },
  starActive: { color: '#F59E0B' },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: ServaTheme.foreground,
    marginBottom: 6,
  },
  textarea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: ServaTheme.border,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: ServaTheme.foreground,
  },
  button: {
    height: 52,
    backgroundColor: ServaTheme.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  disabled: { opacity: 0.6 },
  buttonText: {
    color: ServaTheme.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    marginTop: 16,
  },
});

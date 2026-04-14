import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ServaTheme } from '@/constants/serva-theme';

interface BookingDetail {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  total_cents: number;
  payment_status: string;
  notes: string | null;
  cancellation_reason: string | null;
  service: { name: string; duration_minutes: number } | null;
  business: { id: string; name: string; phone: string | null } | null;
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select(
        `
        id, start_time, end_time, status, total_cents, payment_status,
        notes, cancellation_reason,
        service:services(name, duration_minutes),
        business:businesses(id, name, phone)
      `,
      )
      .eq('id', id)
      .maybeSingle();
    setBooking(data as unknown as BookingDetail);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleCancel = () => {
    Alert.alert(
      'Cancel booking?',
      'This will cancel your appointment and may incur a fee depending on the business\u2019s policy.',
      [
        { text: 'Keep booking', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: async () => {
            await supabase
              .from('bookings')
              .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
              })
              .eq('id', id);
            await load();
          },
        },
      ],
    );
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
        <Text style={styles.emptyText}>Booking not found.</Text>
      </SafeAreaView>
    );
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  const canCancel =
    booking.status === 'pending' || booking.status === 'confirmed';
  const canReview = booking.status === 'completed';

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Booking' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {booking.service?.name ?? 'Service'}
        </Text>
        <Text style={styles.bizName}>{booking.business?.name}</Text>
        <Text style={[styles.status, statusColor(booking.status)]}>
          {booking.status.replace('_', ' ')}
        </Text>

        <View style={styles.card}>
          <Row label="When" value={fmt(booking.start_time)} />
          <Row label="Duration" value={`${booking.service?.duration_minutes} min`} />
          <Row
            label="Total"
            value={`$${(booking.total_cents / 100).toFixed(2)}`}
          />
          <Row
            label="Payment"
            value={booking.payment_status.replace('_', ' ')}
          />
          {booking.business?.phone && (
            <Row label="Business phone" value={booking.business.phone} />
          )}
        </View>

        {booking.cancellation_reason && (
          <View style={[styles.card, styles.infoCard]}>
            <Text style={styles.infoLabel}>Cancellation reason</Text>
            <Text style={styles.infoValue}>{booking.cancellation_reason}</Text>
          </View>
        )}

        <View style={styles.actions}>
          {canReview && (
            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                router.push({
                  pathname: '/review/[bookingId]',
                  params: { bookingId: booking.id },
                })
              }
            >
              <Text style={styles.buttonText}>Write a review</Text>
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity
              style={[styles.button, styles.destructive]}
              onPress={handleCancel}
            >
              <Text style={[styles.buttonText, styles.destructiveText]}>
                Cancel booking
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function statusColor(status: string) {
  if (status === 'confirmed') return { color: '#1d4ed8' };
  if (status === 'completed') return { color: '#16a34a' };
  if (status === 'cancelled' || status === 'no_show') return { color: '#71717a' };
  return { color: '#d97706' };
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
  content: { padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: ServaTheme.foreground,
  },
  bizName: {
    fontSize: 15,
    color: ServaTheme.mutedForeground,
    marginTop: 2,
  },
  status: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: ServaTheme.muted,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    gap: 10,
  },
  infoCard: { marginTop: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 13, color: ServaTheme.mutedForeground },
  rowValue: {
    fontSize: 14,
    color: ServaTheme.foreground,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: ServaTheme.mutedForeground,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: ServaTheme.foreground,
    marginTop: 4,
  },
  actions: { marginTop: 24, gap: 12 },
  button: {
    height: 52,
    backgroundColor: ServaTheme.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destructive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: ServaTheme.destructive,
  },
  buttonText: {
    color: ServaTheme.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  destructiveText: { color: ServaTheme.destructive },
  emptyText: { fontSize: 14, color: ServaTheme.mutedForeground },
});

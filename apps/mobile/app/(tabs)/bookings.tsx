import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { ServaTheme } from '@/constants/serva-theme';

interface BookingRow {
  id: string;
  start_time: string;
  status: string;
  total_cents: number;
  service: { name: string } | null;
  business: { name: string } | null;
}

export default function BookingsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<BookingRow[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('bookings')
      .select(
        'id, start_time, status, total_cents, service:services(name), business:businesses(name)',
      )
      .eq('consumer_id', user.id)
      .order('start_time', { ascending: false });
    setBookings((data ?? []) as unknown as BookingRow[]);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    load().then(() => setLoading(false));
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My bookings</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={ServaTheme.accent} />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptySub}>
            Search for services and book your first appointment.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {bookings.map((b) => (
            <Pressable
              key={b.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/booking/[id]',
                  params: { id: b.id },
                })
              }
            >
              <Text style={styles.bizName}>{b.business?.name ?? '—'}</Text>
              <Text style={styles.serviceName}>{b.service?.name ?? '—'}</Text>
              <View style={styles.row}>
                <Text style={styles.meta}>{fmt(b.start_time)}</Text>
                <Text style={[styles.meta, styles.status]}>
                  {b.status.replace('_', ' ')}
                </Text>
              </View>
              <Text style={styles.price}>
                ${(b.total_cents / 100).toFixed(2)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ServaTheme.background },
  header: { padding: 20, paddingBottom: 12 },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: ServaTheme.foreground,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ServaTheme.foreground,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 14,
    color: ServaTheme.mutedForeground,
    textAlign: 'center',
  },
  list: { padding: 20, paddingTop: 0, gap: 12 },
  card: {
    backgroundColor: ServaTheme.muted,
    padding: 16,
    borderRadius: 12,
    gap: 4,
    marginBottom: 12,
  },
  bizName: {
    fontSize: 16,
    fontWeight: '600',
    color: ServaTheme.foreground,
  },
  serviceName: {
    fontSize: 14,
    color: ServaTheme.mutedForeground,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  meta: { fontSize: 13, color: ServaTheme.mutedForeground },
  status: { textTransform: 'capitalize' },
  price: {
    fontSize: 15,
    fontWeight: '600',
    color: ServaTheme.primary,
    marginTop: 4,
  },
});

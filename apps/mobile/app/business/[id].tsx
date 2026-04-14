import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import type { Business, Service, Review } from '@/lib/types';
import { formatPrice } from '@/lib/types';
import { ServaTheme } from '@/constants/serva-theme';

type Tab = 'services' | 'reviews' | 'info';

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('services');

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [bRes, sRes, rRes] = await Promise.all([
        supabase.from('businesses').select('*').eq('id', id).maybeSingle(),
        supabase
          .from('services')
          .select('*')
          .eq('business_id', id)
          .eq('is_active', true)
          .order('display_order'),
        supabase
          .from('reviews')
          .select(
            'id, rating, comment, created_at, consumer:profiles!reviews_consumer_id_fkey(first_name, last_name)',
          )
          .eq('business_id', id)
          .eq('is_removed', false)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);
      setBusiness((bRes.data as Business) ?? null);
      setServices((sRes.data ?? []) as Service[]);
      setReviews((rRes.data ?? []) as unknown as Review[]);
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

  if (!business) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyText}>Business not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: business.name }} />
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.name}>{business.name}</Text>
          <Text style={styles.rating}>
            ★ {Number(business.avg_rating).toFixed(1)}{' '}
            <Text style={styles.reviewCount}>
              ({business.total_reviews} reviews)
            </Text>
          </Text>
          {business.description && (
            <Text style={styles.description}>{business.description}</Text>
          )}
        </View>

        <View style={styles.tabs}>
          {(['services', 'reviews', 'info'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              style={[styles.tab, activeTab === t && styles.activeTab]}
              onPress={() => setActiveTab(t)}
            >
              <Text
                style={[styles.tabLabel, activeTab === t && styles.activeTabLabel]}
              >
                {t === 'services' ? 'Services' : t === 'reviews' ? 'Reviews' : 'Info'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'services' && (
            <View style={styles.servicesList}>
              {services.length === 0 && (
                <Text style={styles.emptyText}>No services yet.</Text>
              )}
              {services.map((s) => (
                <Pressable
                  key={s.id}
                  style={styles.serviceCard}
                  onPress={() =>
                    router.push({
                      pathname: '/book/[serviceId]',
                      params: { serviceId: s.id },
                    })
                  }
                >
                  <View style={styles.serviceRow}>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{s.name}</Text>
                      {s.description && (
                        <Text style={styles.serviceDesc} numberOfLines={2}>
                          {s.description}
                        </Text>
                      )}
                      <Text style={styles.serviceDuration}>
                        {s.duration_minutes} min
                      </Text>
                    </View>
                    <Text style={styles.servicePrice}>
                      {formatPrice(s.price_cents, s.price_type)}
                    </Text>
                  </View>
                  <Text style={styles.bookHint}>Tap to book →</Text>
                </Pressable>
              ))}
            </View>
          )}

          {activeTab === 'reviews' && (
            <View style={styles.reviewsList}>
              {reviews.length === 0 && (
                <Text style={styles.emptyText}>No reviews yet.</Text>
              )}
              {reviews.map((r) => {
                const name =
                  [r.consumer?.first_name, r.consumer?.last_name]
                    .filter(Boolean)
                    .join(' ')
                    .trim() || 'Anonymous';
                return (
                  <View key={r.id} style={styles.reviewCard}>
                    <Text style={styles.reviewRating}>
                      {'★'.repeat(r.rating)}
                      {'☆'.repeat(5 - r.rating)}
                    </Text>
                    <Text style={styles.reviewAuthor}>{name}</Text>
                    {r.comment && (
                      <Text style={styles.reviewComment}>{r.comment}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {activeTab === 'info' && (
            <View style={styles.infoList}>
              {business.address && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>
                    {business.address.line1}
                    {business.address.line2 && `\n${business.address.line2}`}
                    {'\n'}
                    {business.address.city}, {business.address.state}{' '}
                    {business.address.postal_code}
                  </Text>
                </View>
              )}
              {business.phone && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{business.phone}</Text>
                </View>
              )}
              {business.email && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{business.email}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  header: { padding: 20, gap: 6 },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: ServaTheme.primary,
  },
  rating: {
    fontSize: 15,
    color: '#F59E0B',
    fontWeight: '600',
  },
  reviewCount: { color: ServaTheme.mutedForeground, fontWeight: '400' },
  description: {
    fontSize: 15,
    color: ServaTheme.mutedForeground,
    lineHeight: 22,
    marginTop: 8,
  },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: ServaTheme.border,
    marginTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: ServaTheme.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: ServaTheme.mutedForeground,
  },
  activeTabLabel: { color: ServaTheme.primary },
  tabContent: { padding: 20 },
  servicesList: { gap: 12 },
  serviceCard: {
    backgroundColor: ServaTheme.muted,
    padding: 16,
    borderRadius: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceInfo: { flex: 1, paddingRight: 12 },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: ServaTheme.foreground,
  },
  serviceDesc: {
    fontSize: 13,
    color: ServaTheme.mutedForeground,
    marginTop: 2,
  },
  serviceDuration: {
    fontSize: 12,
    color: ServaTheme.mutedForeground,
    marginTop: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: ServaTheme.primary,
  },
  bookHint: {
    fontSize: 12,
    color: ServaTheme.accent,
    fontWeight: '500',
    marginTop: 8,
  },
  reviewsList: { gap: 16 },
  reviewCard: {
    borderBottomWidth: 1,
    borderBottomColor: ServaTheme.border,
    paddingBottom: 12,
  },
  reviewRating: { color: '#F59E0B', fontSize: 14 },
  reviewAuthor: {
    fontSize: 13,
    color: ServaTheme.mutedForeground,
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: ServaTheme.foreground,
    marginTop: 6,
    lineHeight: 20,
  },
  infoList: { gap: 16 },
  infoRow: {},
  infoLabel: {
    fontSize: 11,
    color: ServaTheme.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: ServaTheme.foreground,
    lineHeight: 22,
  },
  emptyText: {
    fontSize: 14,
    color: ServaTheme.mutedForeground,
    textAlign: 'center',
    paddingVertical: 20,
  },
});

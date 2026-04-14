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
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import type { Category, Business } from '@/lib/types';
import { ServaTheme } from '@/constants/serva-theme';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [catRes, bizRes] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .order('display_order')
          .limit(8),
        supabase
          .from('businesses')
          .select('id, name, slug, description, avg_rating, total_reviews')
          .eq('approval_status', 'approved')
          .order('avg_rating', { ascending: false })
          .limit(6),
      ]);
      setCategories((catRes.data ?? []) as Category[]);
      setFeatured((bizRes.data ?? []) as unknown as Business[]);
      setLoading(false);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>Serva</Text>
        <Text style={styles.hello}>
          Hi{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </Text>
        <Text style={styles.subtitle}>Book local services in seconds.</Text>

        <Pressable
          style={styles.searchBox}
          onPress={() => router.push('/(tabs)/search')}
        >
          <Text style={styles.searchPlaceholder}>
            Search services and businesses…
          </Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Categories</Text>
        {loading && categories.length === 0 ? (
          <ActivityIndicator color={ServaTheme.accent} />
        ) : (
          <View style={styles.categoryGrid}>
            {categories.map((c) => (
              <Pressable
                key={c.id}
                style={styles.categoryCard}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/search',
                    params: { category: c.slug },
                  })
                }
              >
                <Text style={styles.categoryEmoji}>
                  {c.icon_emoji ?? '•'}
                </Text>
                <Text style={styles.categoryName}>{c.name}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {featured.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Top-rated businesses</Text>
            <View style={styles.featuredList}>
              {featured.map((b) => (
                <Pressable
                  key={b.id}
                  style={styles.bizCard}
                  onPress={() =>
                    router.push({
                      pathname: '/business/[id]',
                      params: { id: b.id },
                    })
                  }
                >
                  <Text style={styles.bizName}>{b.name}</Text>
                  {b.description && (
                    <Text style={styles.bizDesc} numberOfLines={2}>
                      {b.description}
                    </Text>
                  )}
                  <Text style={styles.bizRating}>
                    ★ {Number(b.avg_rating).toFixed(1)}{' '}
                    <Text style={styles.bizReviews}>
                      ({b.total_reviews} reviews)
                    </Text>
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ServaTheme.background },
  content: { padding: 20, paddingBottom: 40 },
  brand: {
    fontSize: 24,
    fontWeight: '700',
    color: ServaTheme.primary,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  hello: {
    fontSize: 28,
    fontWeight: '600',
    color: ServaTheme.foreground,
  },
  subtitle: {
    fontSize: 15,
    color: ServaTheme.mutedForeground,
    marginTop: 4,
    marginBottom: 20,
  },
  searchBox: {
    height: 48,
    backgroundColor: ServaTheme.muted,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginBottom: 24,
  },
  searchPlaceholder: { color: ServaTheme.mutedForeground, fontSize: 15 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: ServaTheme.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  categoryCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: ServaTheme.muted,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  categoryEmoji: { fontSize: 32 },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: ServaTheme.foreground,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  featuredList: { gap: 12 },
  bizCard: {
    backgroundColor: ServaTheme.muted,
    padding: 16,
    borderRadius: 12,
  },
  bizName: {
    fontSize: 17,
    fontWeight: '600',
    color: ServaTheme.foreground,
    marginBottom: 4,
  },
  bizDesc: {
    fontSize: 14,
    color: ServaTheme.mutedForeground,
    marginBottom: 8,
  },
  bizRating: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
  },
  bizReviews: {
    color: ServaTheme.mutedForeground,
    fontWeight: '400',
  },
});

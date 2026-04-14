import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { ServaTheme } from '@/constants/serva-theme';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>Serva</Text>
        <Text style={styles.hello}>
          Hello{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </Text>
        <Text style={styles.subtitle}>
          Find and book local services in seconds.
        </Text>

        <Pressable
          style={styles.searchBox}
          onPress={() => router.push('/(tabs)/search')}
        >
          <Text style={styles.searchPlaceholder}>
            Search for services or businesses…
          </Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Popular categories</Text>
        <View style={styles.categoryGrid}>
          {[
            { emoji: '💇', name: 'Hair' },
            { emoji: '💅', name: 'Nails' },
            { emoji: '💆', name: 'Massage' },
            { emoji: '💪', name: 'Fitness' },
            { emoji: '🧘', name: 'Yoga' },
            { emoji: '🐾', name: 'Pet care' },
          ].map((c) => (
            <Pressable key={c.name} style={styles.categoryCard}>
              <Text style={styles.categoryEmoji}>{c.emoji}</Text>
              <Text style={styles.categoryName}>{c.name}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Coming next (Phase 7)</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Search, business profiles, real-time booking, Stripe payment sheet,
            intake forms, and reviews. The mobile shell is now ready —
            Phase 7 fills it out.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ServaTheme.background },
  content: { padding: 20 },
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
    fontSize: 13,
    fontWeight: '500',
    color: ServaTheme.foreground,
  },
  infoCard: {
    backgroundColor: ServaTheme.muted,
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: ServaTheme.mutedForeground,
    lineHeight: 20,
  },
});

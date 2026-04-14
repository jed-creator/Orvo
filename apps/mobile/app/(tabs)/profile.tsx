import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { ServaTheme } from '@/constants/serva-theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email ?? '—'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Member since</Text>
          <Text style={styles.value}>
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString()
              : '—'}
          </Text>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ServaTheme.background },
  content: { padding: 20 },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: ServaTheme.foreground,
    marginBottom: 20,
  },
  card: {
    backgroundColor: ServaTheme.muted,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: ServaTheme.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: { fontSize: 15, color: ServaTheme.foreground, fontWeight: '500' },
  signOutBtn: {
    height: 48,
    backgroundColor: ServaTheme.muted,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  signOutText: {
    color: ServaTheme.destructive,
    fontSize: 15,
    fontWeight: '600',
  },
});

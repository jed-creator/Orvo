import { View, Text, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ServaTheme } from '@/constants/serva-theme';

export default function SearchScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Search</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search services, businesses, categories…"
          placeholderTextColor={ServaTheme.mutedForeground}
        />
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Full search (full-text + geo) comes in Phase 7 Steps 65–66.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ServaTheme.background },
  content: { padding: 20, flex: 1 },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: ServaTheme.foreground,
    marginBottom: 20,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: ServaTheme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: ServaTheme.foreground,
    marginBottom: 20,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  placeholderText: {
    fontSize: 14,
    color: ServaTheme.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },
});

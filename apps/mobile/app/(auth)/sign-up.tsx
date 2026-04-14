import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { ServaTheme } from '@/constants/serva-theme';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignUp = async () => {
    setError(null);
    setSuccess(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const { error: err, needsConfirmation } = await signUp(
      email.trim(),
      password,
      firstName.trim(),
      lastName.trim(),
    );
    setLoading(false);

    if (err) {
      setError(err);
    } else if (needsConfirmation) {
      setSuccess(
        'Account created! Check your email for a verification link before signing in.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.brand}>Serva</Text>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Join Serva to find and book local services.
          </Text>

          {error && <Text style={styles.error}>{error}</Text>}
          {success && <Text style={styles.success}>{success}</Text>}

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>First name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                autoComplete="given-name"
                editable={!loading}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Last name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                autoComplete="family-name"
                editable={!loading}
              />
            </View>
          </View>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#a1a1aa"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            placeholderTextColor="#a1a1aa"
            secureTextEntry
            autoComplete="password-new"
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={ServaTheme.primaryForeground} />
            ) : (
              <Text style={styles.buttonText}>Create account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/sign-in" style={styles.link}>
              Sign in
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ServaTheme.background },
  flex: { flex: 1 },
  scroll: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    color: ServaTheme.primary,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: ServaTheme.foreground,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: ServaTheme.mutedForeground,
    marginBottom: 20,
  },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: ServaTheme.foreground,
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: ServaTheme.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    color: ServaTheme.foreground,
  },
  button: {
    height: 52,
    backgroundColor: ServaTheme.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
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
    marginBottom: 8,
  },
  success: {
    backgroundColor: '#f0fdf4',
    color: '#14532d',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: { color: ServaTheme.mutedForeground, fontSize: 14 },
  link: { color: ServaTheme.accent, fontSize: 14, fontWeight: '600' },
});

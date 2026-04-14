import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import type { Service, FormTemplate, FormField } from '@/lib/types';
import { formatPrice } from '@/lib/types';
import { ServaTheme } from '@/constants/serva-theme';

interface ServiceWithBusiness extends Service {
  business: { id: string; name: string } | null;
}

export default function BookServiceScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [service, setService] = useState<ServiceWithBusiness | null>(null);
  const [form, setForm] = useState<FormTemplate | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) return;
    (async () => {
      setLoading(true);
      const { data: svc } = await supabase
        .from('services')
        .select(
          '*, business:businesses(id, name)',
        )
        .eq('id', serviceId)
        .maybeSingle();
      setService((svc as unknown as ServiceWithBusiness) ?? null);

      if (svc?.intake_form_id) {
        const [formRes, fieldsRes] = await Promise.all([
          supabase
            .from('form_templates')
            .select('*')
            .eq('id', svc.intake_form_id)
            .maybeSingle(),
          supabase
            .from('form_fields')
            .select('*')
            .eq('form_id', svc.intake_form_id)
            .order('display_order'),
        ]);
        setForm(formRes.data as FormTemplate | null);
        setFields((fieldsRes.data ?? []) as FormField[]);
      }
      setLoading(false);
    })();
  }, [serviceId]);

  const handleSubmit = async () => {
    setError(null);
    if (!service || !user) return;
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setError('Enter date as YYYY-MM-DD.');
      return;
    }
    if (!time.match(/^\d{2}:\d{2}$/)) {
      setError('Enter time as HH:MM (24-hour).');
      return;
    }

    // Validate required intake fields
    for (const f of fields) {
      if (f.is_required && !fieldValues[f.id]?.trim()) {
        setError(`"${f.label}" is required.`);
        return;
      }
    }

    setSubmitting(true);

    const start = new Date(`${date}T${time}:00`);
    const end = new Date(start.getTime() + service.duration_minutes * 60_000);

    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .insert({
        consumer_id: user.id,
        business_id: service.business?.id,
        service_id: service.id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: 'pending',
        total_cents: service.price_cents,
        payment_status: 'pending',
      })
      .select('id')
      .single();

    if (bookingErr || !booking) {
      setError(bookingErr?.message ?? 'Could not create booking.');
      setSubmitting(false);
      return;
    }

    // Insert intake submission if form was provided
    if (form && fields.length > 0) {
      const { data: submission, error: subErr } = await supabase
        .from('form_submissions')
        .insert({
          form_id: form.id,
          booking_id: booking.id,
          consumer_id: user.id,
        })
        .select('id')
        .single();

      if (!subErr && submission) {
        const values = fields.map((f) => ({
          submission_id: submission.id,
          field_id: f.id,
          value: fieldValues[f.id] ?? null,
        }));
        await supabase.from('form_field_values').insert(values);

        await supabase
          .from('bookings')
          .update({ intake_submission_id: submission.id })
          .eq('id', booking.id);
      }
    }

    setSubmitting(false);
    router.replace({
      pathname: '/booking/[id]/confirmation',
      params: { id: booking.id },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={ServaTheme.accent} />
      </SafeAreaView>
    );
  }
  if (!service) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyText}>Service not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Book service' }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.serviceCard}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceBiz}>{service.business?.name}</Text>
            <View style={styles.serviceMeta}>
              <Text style={styles.servicePrice}>
                {formatPrice(service.price_cents, service.price_type)}
              </Text>
              <Text style={styles.serviceDuration}>
                {service.duration_minutes} min
              </Text>
            </View>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Text style={styles.sectionTitle}>Pick a date & time</Text>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD (e.g. 2026-05-15)"
            placeholderTextColor="#a1a1aa"
            autoCapitalize="none"
          />
          <Text style={styles.label}>Time (24-hour)</Text>
          <TextInput
            style={styles.input}
            value={time}
            onChangeText={setTime}
            placeholder="HH:MM (e.g. 14:30)"
            placeholderTextColor="#a1a1aa"
            autoCapitalize="none"
          />

          {form && fields.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{form.name}</Text>
              {form.description && (
                <Text style={styles.formDescription}>{form.description}</Text>
              )}
              {fields.map((f) => (
                <View key={f.id}>
                  <Text style={styles.label}>
                    {f.label}
                    {f.is_required && <Text style={styles.req}> *</Text>}
                  </Text>
                  {f.help_text && (
                    <Text style={styles.helpText}>{f.help_text}</Text>
                  )}
                  <TextInput
                    style={
                      f.field_type === 'textarea' ? styles.textarea : styles.input
                    }
                    multiline={f.field_type === 'textarea'}
                    numberOfLines={f.field_type === 'textarea' ? 4 : 1}
                    keyboardType={
                      f.field_type === 'email'
                        ? 'email-address'
                        : f.field_type === 'phone'
                        ? 'phone-pad'
                        : f.field_type === 'number'
                        ? 'numeric'
                        : 'default'
                    }
                    value={fieldValues[f.id] ?? ''}
                    onChangeText={(v) =>
                      setFieldValues((prev) => ({ ...prev, [f.id]: v }))
                    }
                    placeholder={f.placeholder ?? ''}
                    placeholderTextColor="#a1a1aa"
                    autoCapitalize="none"
                  />
                </View>
              ))}
            </>
          )}

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={ServaTheme.primaryForeground} />
            ) : (
              <Text style={styles.buttonText}>
                Book {formatPrice(service.price_cents, service.price_type)}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Payment will be collected at the time of service for MVP. Real
            Stripe payment sheet comes in Phase 7+ after native build.
          </Text>
        </ScrollView>
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
  content: { padding: 20, paddingBottom: 60 },
  serviceCard: {
    backgroundColor: ServaTheme.muted,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: ServaTheme.foreground,
  },
  serviceBiz: {
    fontSize: 14,
    color: ServaTheme.mutedForeground,
    marginTop: 2,
  },
  serviceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  servicePrice: {
    fontSize: 17,
    fontWeight: '700',
    color: ServaTheme.primary,
  },
  serviceDuration: {
    fontSize: 14,
    color: ServaTheme.mutedForeground,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: ServaTheme.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: ServaTheme.foreground,
    marginTop: 14,
    marginBottom: 6,
  },
  req: { color: ServaTheme.destructive },
  helpText: {
    fontSize: 12,
    color: ServaTheme.mutedForeground,
    marginBottom: 4,
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
  textarea: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: ServaTheme.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    fontSize: 16,
    color: ServaTheme.foreground,
    textAlignVertical: 'top',
  },
  formDescription: {
    fontSize: 14,
    color: ServaTheme.mutedForeground,
    marginBottom: 8,
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
  disclaimer: {
    fontSize: 12,
    color: ServaTheme.mutedForeground,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: ServaTheme.mutedForeground,
  },
});

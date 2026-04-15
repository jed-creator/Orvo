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
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import type { Service, FormTemplate, FormField } from '@/lib/types';
import { formatPrice } from '@/lib/types';
import { OrvoTheme } from '@/constants/orvo-theme';

interface ServiceWithBusiness extends Service {
  business: { id: string; name: string } | null;
}

// Default the picker to tomorrow at 10am — a friendly starting slot that
// falls inside every seeded business's 9–5 availability.
function initialBookingDateTime(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
}

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeLabel(d: Date): string {
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function BookServiceScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [service, setService] = useState<ServiceWithBusiness | null>(null);
  const [form, setForm] = useState<FormTemplate | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);

  const [bookingDateTime, setBookingDateTime] = useState<Date>(
    initialBookingDateTime,
  );
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
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

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    // Android dismisses after one interaction; iOS keeps the picker mounted.
    if (Platform.OS !== 'ios') {
      setPickerMode(null);
    }
    if (event.type === 'set' && selected) {
      setBookingDateTime((prev) => {
        const next = new Date(prev);
        if (pickerMode === 'date') {
          next.setFullYear(selected.getFullYear());
          next.setMonth(selected.getMonth());
          next.setDate(selected.getDate());
        } else if (pickerMode === 'time') {
          next.setHours(selected.getHours());
          next.setMinutes(selected.getMinutes());
          next.setSeconds(0);
          next.setMilliseconds(0);
        }
        return next;
      });
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!service || !user) return;

    // Validate required intake fields
    for (const f of fields) {
      if (f.is_required && !fieldValues[f.id]?.trim()) {
        setError(`"${f.label}" is required.`);
        return;
      }
    }

    setSubmitting(true);

    const start = new Date(bookingDateTime);
    const end = new Date(start.getTime() + service.duration_minutes * 60_000);

    // Demo mode: no payment gating — skip straight to a confirmed booking.
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .insert({
        consumer_id: user.id,
        business_id: service.business?.id,
        service_id: service.id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: 'confirmed',
        total_cents: service.price_cents,
        payment_status: 'captured',
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
        <ActivityIndicator color={OrvoTheme.accent} />
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
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() =>
              setPickerMode(pickerMode === 'date' ? null : 'date')
            }
            activeOpacity={0.7}
          >
            <Text style={styles.pickerButtonText}>
              {formatDateLabel(bookingDateTime)}
            </Text>
          </TouchableOpacity>
          <Text style={styles.label}>Time</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() =>
              setPickerMode(pickerMode === 'time' ? null : 'time')
            }
            activeOpacity={0.7}
          >
            <Text style={styles.pickerButtonText}>
              {formatTimeLabel(bookingDateTime)}
            </Text>
          </TouchableOpacity>
          {pickerMode && (
            <View style={styles.pickerWrapper}>
              <DateTimePicker
                value={bookingDateTime}
                mode={pickerMode}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={pickerMode === 'date' ? new Date() : undefined}
                minuteInterval={15}
                onChange={onPickerChange}
              />
            </View>
          )}

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
              <ActivityIndicator color={OrvoTheme.primaryForeground} />
            ) : (
              <Text style={styles.buttonText}>
                Book {formatPrice(service.price_cents, service.price_type)}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            This is a demo booking — no payment is collected. A confirmation
            will be sent to your email.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OrvoTheme.background },
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OrvoTheme.background,
  },
  content: { padding: 20, paddingBottom: 60 },
  serviceCard: {
    backgroundColor: OrvoTheme.muted,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: OrvoTheme.foreground,
  },
  serviceBiz: {
    fontSize: 14,
    color: OrvoTheme.mutedForeground,
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
    color: OrvoTheme.primary,
  },
  serviceDuration: {
    fontSize: 14,
    color: OrvoTheme.mutedForeground,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: OrvoTheme.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: OrvoTheme.foreground,
    marginTop: 14,
    marginBottom: 6,
  },
  req: { color: OrvoTheme.destructive },
  helpText: {
    fontSize: 12,
    color: OrvoTheme.mutedForeground,
    marginBottom: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: OrvoTheme.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    color: OrvoTheme.foreground,
  },
  pickerButton: {
    height: 48,
    borderWidth: 1,
    borderColor: OrvoTheme.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: OrvoTheme.background,
  },
  pickerButtonText: {
    fontSize: 16,
    color: OrvoTheme.foreground,
  },
  pickerWrapper: {
    marginTop: 8,
    backgroundColor: OrvoTheme.muted,
    borderRadius: 8,
    overflow: 'hidden',
  },
  textarea: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: OrvoTheme.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    fontSize: 16,
    color: OrvoTheme.foreground,
    textAlignVertical: 'top',
  },
  formDescription: {
    fontSize: 14,
    color: OrvoTheme.mutedForeground,
    marginBottom: 8,
  },
  button: {
    height: 52,
    backgroundColor: OrvoTheme.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: OrvoTheme.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: OrvoTheme.mutedForeground,
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
    color: OrvoTheme.mutedForeground,
  },
});

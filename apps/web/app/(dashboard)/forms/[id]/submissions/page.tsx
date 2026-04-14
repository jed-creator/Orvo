import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface SubmissionRow {
  id: string;
  submitted_at: string;
  consumer: { first_name: string | null; last_name: string | null; email: string } | null;
  booking: { id: string; start_time: string } | null;
}

interface FieldValueRow {
  submission_id: string;
  value: string | null;
  field: { label: string } | null;
}

export default async function FormSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: form } = await supabase
    .from('form_templates')
    .select('id, name')
    .eq('id', id)
    .maybeSingle();
  if (!form) notFound();

  const { data: submissions } = await supabase
    .from('form_submissions')
    .select(
      `
      id, submitted_at,
      consumer:profiles!form_submissions_consumer_id_fkey(first_name, last_name, email),
      booking:bookings(id, start_time)
    `,
    )
    .eq('form_id', id)
    .order('submitted_at', { ascending: false });

  const subs = (submissions ?? []) as unknown as SubmissionRow[];

  // Fetch all field values for all submissions in one query
  const submissionIds = subs.map((s) => s.id);
  const { data: values } =
    submissionIds.length > 0
      ? await supabase
          .from('form_field_values')
          .select('submission_id, value, field:form_fields(label)')
          .in('submission_id', submissionIds)
      : { data: [] };

  const valuesBySubmission: Record<string, { label: string; value: string }[]> =
    {};
  ((values ?? []) as unknown as FieldValueRow[]).forEach((v) => {
    (valuesBySubmission[v.submission_id] ??= []).push({
      label: v.field?.label ?? '',
      value: v.value ?? '',
    });
  });

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <div>
        <Link
          href={`/dashboard/forms/${id}`}
          className="text-sm text-brand-accent hover:underline"
        >
          ← Back to form
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-brand-primary mt-2">
          {form.name} · Submissions
        </h1>
      </div>

      {subs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No submissions yet</CardTitle>
            <CardDescription>
              When customers fill this form during booking, their responses
              appear here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {subs.map((s) => {
            const name =
              [s.consumer?.first_name, s.consumer?.last_name]
                .filter(Boolean)
                .join(' ')
                .trim() || s.consumer?.email || 'Unknown';
            const fieldValues = valuesBySubmission[s.id] ?? [];
            return (
              <Card key={s.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{name}</CardTitle>
                  <CardDescription>
                    Submitted {new Date(s.submitted_at).toLocaleString()}
                    {s.booking && (
                      <>
                        {' · '}
                        <Link
                          href={`/dashboard/bookings/${s.booking.id}`}
                          className="text-brand-accent hover:underline"
                        >
                          View booking
                        </Link>
                      </>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {fieldValues.length === 0 ? (
                    <p className="text-sm text-zinc-500">No field values.</p>
                  ) : (
                    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
                      {fieldValues.map((v, i) => (
                        <div key={i} className="contents">
                          <dt className="text-zinc-500">{v.label}</dt>
                          <dd className="text-zinc-900">{v.value || '—'}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

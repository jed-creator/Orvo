import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { deleteFormTemplateAction } from '@/app/actions/forms';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormFieldEditor } from '@/components/forms/field-editor';

export default async function EditFormPage({
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
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!form) notFound();

  const { data: fields } = await supabase
    .from('form_fields')
    .select('*')
    .eq('form_id', id)
    .order('display_order');

  async function doDelete() {
    'use server';
    await deleteFormTemplateAction(id);
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/forms"
          className="text-sm text-brand-accent hover:underline"
        >
          ← Back to forms
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-3xl font-semibold tracking-tight text-brand-primary">
            {form.name}
          </h1>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/forms/${id}/submissions`}>
              <Button variant="outline">Submissions</Button>
            </Link>
            <form action={doDelete}>
              <Button variant="ghost" type="submit">
                Delete
              </Button>
            </form>
          </div>
        </div>
        {form.description && (
          <p className="text-zinc-600 mt-1">{form.description}</p>
        )}
      </div>

      <FormFieldEditor formId={id} fields={fields ?? []} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
          <CardDescription>
            How this form appears to customers during booking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(!fields || fields.length === 0) && (
            <p className="text-sm text-zinc-500">Add fields to see a preview.</p>
          )}
          {fields && fields.length > 0 && (
            <form className="flex flex-col gap-4 opacity-90">
              {fields.map((f) => (
                <div key={f.id} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700">
                    {f.label}
                    {f.is_required && (
                      <span className="text-red-600 ml-1">*</span>
                    )}
                  </label>
                  {f.help_text && (
                    <p className="text-xs text-zinc-500">{f.help_text}</p>
                  )}
                  {renderPreviewField(f)}
                </div>
              ))}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type PreviewField = {
  id: string;
  field_type: string;
  placeholder: string | null;
  options: string[] | null;
};

function renderPreviewField(f: PreviewField) {
  const base =
    'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm';
  switch (f.field_type) {
    case 'textarea':
      return <textarea className={base + ' min-h-[80px]'} disabled />;
    case 'select':
      return (
        <select className={base} disabled>
          <option>Select an option…</option>
          {(f.options ?? []).map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      );
    case 'checkbox':
      return (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" disabled /> {f.placeholder || 'I agree'}
        </label>
      );
    case 'date':
      return <input type="date" className={base} disabled />;
    case 'number':
      return <input type="number" className={base} disabled />;
    case 'email':
      return <input type="email" className={base} disabled />;
    case 'phone':
      return <input type="tel" className={base} disabled />;
    default:
      return <input type="text" className={base} disabled />;
  }
}

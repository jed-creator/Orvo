'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { formTemplateSchema, formFieldSchema } from '@/lib/validations/forms';

export type FormActionState = {
  errors?: Record<string, string[]>;
  success?: boolean;
  formId?: string;
};

async function getUserBusinessId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();
  return data?.id ?? null;
}

export async function createFormTemplateAction(
  _prev: FormActionState | undefined,
  formData: FormData,
): Promise<FormActionState> {
  const validated = formTemplateSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || '',
    is_required: formData.get('is_required') === 'on',
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const businessId = await getUserBusinessId();
  if (!businessId) return { errors: { _form: ['Create a business first.'] } };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('form_templates')
    .insert({
      business_id: businessId,
      name: validated.data.name,
      description: validated.data.description || null,
      is_required: validated.data.is_required,
    })
    .select('id')
    .single();

  if (error) return { errors: { _form: [error.message] } };

  revalidatePath('/dashboard/forms');
  redirect(`/dashboard/forms/${data.id}`);
}

export async function updateFormTemplateAction(
  formId: string,
  _prev: FormActionState | undefined,
  formData: FormData,
): Promise<FormActionState> {
  const validated = formTemplateSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || '',
    is_required: formData.get('is_required') === 'on',
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('form_templates')
    .update({
      name: validated.data.name,
      description: validated.data.description || null,
      is_required: validated.data.is_required,
    })
    .eq('id', formId);

  if (error) return { errors: { _form: [error.message] } };

  revalidatePath(`/dashboard/forms/${formId}`);
  return { success: true };
}

export async function deleteFormTemplateAction(formId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('form_templates')
    .delete()
    .eq('id', formId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/forms');
  redirect('/dashboard/forms');
}

export async function addFormFieldAction(
  formId: string,
  _prev: FormActionState | undefined,
  formData: FormData,
): Promise<FormActionState> {
  const validated = formFieldSchema.safeParse({
    label: formData.get('label'),
    field_type: formData.get('field_type') || 'text',
    placeholder: formData.get('placeholder') || '',
    help_text: formData.get('help_text') || '',
    is_required: formData.get('is_required') === 'on',
    options: formData.get('options') || '',
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  // Pick next display_order
  const { data: existing } = await supabase
    .from('form_fields')
    .select('display_order')
    .eq('form_id', formId)
    .order('display_order', { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

  const options =
    validated.data.options && validated.data.options.trim()
      ? validated.data.options
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null;

  const { error } = await supabase.from('form_fields').insert({
    form_id: formId,
    label: validated.data.label,
    field_type: validated.data.field_type,
    placeholder: validated.data.placeholder || null,
    help_text: validated.data.help_text || null,
    is_required: validated.data.is_required,
    options,
    display_order: nextOrder,
  });

  if (error) return { errors: { _form: [error.message] } };

  revalidatePath(`/dashboard/forms/${formId}`);
  return { success: true };
}

export async function deleteFormFieldAction(fieldId: string, formId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('form_fields')
    .delete()
    .eq('id', fieldId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/forms/${formId}`);
}

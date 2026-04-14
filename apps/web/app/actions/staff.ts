'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const staffSchema = z.object({
  name: z.string().min(1, { error: 'Name is required.' }).max(255),
  email: z.email({ error: 'Invalid email.' }).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  bio: z.string().max(2000).optional().or(z.literal('')),
});

export type StaffActionState = {
  errors?: Record<string, string[]>;
  success?: boolean;
};

async function getBusinessId(): Promise<string | null> {
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

export async function createStaffAction(
  _prev: StaffActionState | undefined,
  formData: FormData,
): Promise<StaffActionState> {
  const validated = staffSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email') || '',
    phone: formData.get('phone') || '',
    bio: formData.get('bio') || '',
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const businessId = await getBusinessId();
  if (!businessId) return { errors: { _form: ['Create a business first.'] } };

  const supabase = await createClient();
  const { error } = await supabase.from('staff').insert({
    business_id: businessId,
    name: validated.data.name,
    email: validated.data.email || null,
    phone: validated.data.phone || null,
    bio: validated.data.bio || null,
    is_active: true,
  });

  if (error) return { errors: { _form: [error.message] } };

  revalidatePath('/dashboard/staff');
  return { success: true };
}

export async function updateStaffAction(
  staffId: string,
  _prev: StaffActionState | undefined,
  formData: FormData,
): Promise<StaffActionState> {
  const validated = staffSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email') || '',
    phone: formData.get('phone') || '',
    bio: formData.get('bio') || '',
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('staff')
    .update({
      name: validated.data.name,
      email: validated.data.email || null,
      phone: validated.data.phone || null,
      bio: validated.data.bio || null,
    })
    .eq('id', staffId);

  if (error) return { errors: { _form: [error.message] } };
  revalidatePath(`/dashboard/staff/${staffId}`);
  return { success: true };
}

export async function deleteStaffAction(staffId: string) {
  const supabase = await createClient();
  await supabase.from('staff').delete().eq('id', staffId);
  revalidatePath('/dashboard/staff');
  redirect('/dashboard/staff');
}

export async function assignServiceToStaffAction(
  staffId: string,
  serviceId: string,
) {
  const supabase = await createClient();
  await supabase
    .from('staff_services')
    .insert({ staff_id: staffId, service_id: serviceId });
  revalidatePath(`/dashboard/staff/${staffId}`);
}

export async function unassignServiceFromStaffAction(
  staffId: string,
  serviceId: string,
) {
  const supabase = await createClient();
  await supabase
    .from('staff_services')
    .delete()
    .eq('staff_id', staffId)
    .eq('service_id', serviceId);
  revalidatePath(`/dashboard/staff/${staffId}`);
}

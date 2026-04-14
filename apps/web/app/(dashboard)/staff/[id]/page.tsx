import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  deleteStaffAction,
  assignServiceToStaffAction,
  unassignServiceFromStaffAction,
} from '@/app/actions/staff';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function EditStaffPage({
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

  const { data: staff } = await supabase
    .from('staff')
    .select('id, name, email, phone, bio, business_id')
    .eq('id', id)
    .maybeSingle();
  if (!staff) notFound();

  const { data: services } = await supabase
    .from('services')
    .select('id, name')
    .eq('business_id', staff.business_id)
    .eq('is_active', true)
    .order('name');

  const { data: assigned } = await supabase
    .from('staff_services')
    .select('service_id')
    .eq('staff_id', id);

  const assignedIds = new Set((assigned ?? []).map((r) => r.service_id));

  async function doDelete() {
    'use server';
    await deleteStaffAction(id);
  }
  async function doAssign(serviceId: string) {
    'use server';
    await assignServiceToStaffAction(id, serviceId);
  }
  async function doUnassign(serviceId: string) {
    'use server';
    await unassignServiceFromStaffAction(id, serviceId);
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/staff"
          className="text-sm text-brand-accent hover:underline"
        >
          ← Back to staff
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-3xl font-semibold tracking-tight text-brand-primary">
            {staff.name}
          </h1>
          <form action={doDelete}>
            <Button variant="ghost" type="submit">
              Delete
            </Button>
          </form>
        </div>
        <div className="text-sm text-zinc-600 mt-1">
          {staff.email || '—'}
          {staff.phone && ` · ${staff.phone}`}
        </div>
        {staff.bio && <p className="text-sm text-zinc-600 mt-2">{staff.bio}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Service assignments</CardTitle>
          <CardDescription>
            Which services this staff member can provide.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!services || services.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Add services first before assigning them to staff.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {services.map((s) => {
                const isAssigned = assignedIds.has(s.id);
                const action = isAssigned
                  ? doUnassign.bind(null, s.id)
                  : doAssign.bind(null, s.id);
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between border border-zinc-200 rounded-md px-3 py-2"
                  >
                    <span className="text-sm text-zinc-900">{s.name}</span>
                    <form action={action}>
                      <Button
                        variant={isAssigned ? 'outline' : 'default'}
                        size="sm"
                        type="submit"
                      >
                        {isAssigned ? 'Unassign' : 'Assign'}
                      </Button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

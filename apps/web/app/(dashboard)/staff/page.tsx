import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { NewStaffForm } from '@/components/staff/new-staff-form';

export default async function StaffPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!business) redirect('/dashboard/business/new');

  const { data: staff } = await supabase
    .from('staff')
    .select('id, name, email, phone, is_active')
    .eq('business_id', business.id)
    .order('created_at');

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-brand-primary">
          Staff
        </h1>
        <p className="text-zinc-600 mt-1">
          Add team members who provide services. Assign services per staff
          member so customers can pick who they want.
        </p>
      </div>

      <NewStaffForm />

      {staff && staff.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Your team
          </h2>
          {staff.map((s) => (
            <Link key={s.id} href={`/dashboard/staff/${s.id}`} className="block">
              <Card
                className={`hover:border-brand-accent ${
                  !s.is_active ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-zinc-900">{s.name}</h3>
                      <p className="text-sm text-zinc-600">
                        {s.email || '—'}
                        {s.phone && ` · ${s.phone}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

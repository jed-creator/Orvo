import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createFormTemplateAction } from '@/app/actions/forms';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { NewFormForm } from '@/components/forms/new-form';

export default async function FormsPage() {
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

  const { data: forms } = await supabase
    .from('form_templates')
    .select('id, name, description, is_required, created_at')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-brand-primary">
          Intake forms
        </h1>
        <p className="text-zinc-600 mt-1">
          Custom forms that customers fill out when booking. Attach a form to
          a service to collect info upfront (health history, preferences,
          etc.).
        </p>
      </div>

      <NewFormForm />

      {forms && forms.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Your forms
          </h2>
          {forms.map((f) => (
            <Link key={f.id} href={`/dashboard/forms/${f.id}`} className="block">
              <Card className="hover:border-brand-accent">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-zinc-900">{f.name}</h3>
                      {f.description && (
                        <p className="text-sm text-zinc-600 mt-1">
                          {f.description}
                        </p>
                      )}
                    </div>
                    {f.is_required && (
                      <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded">
                        Required
                      </span>
                    )}
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

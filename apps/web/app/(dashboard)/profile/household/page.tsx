import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  addMember,
  createHousehold,
  getOwnedHousehold,
  listMembers,
  removeMember,
  type HouseholdMember,
} from '@/lib/services/household.service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Household' };

const ROLE_LABELS: Record<HouseholdMember['role'], string> = {
  owner: 'Owner',
  adult: 'Adult',
  child: 'Child',
};

async function createHouseholdAction(formData: FormData) {
  'use server';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const name = (formData.get('name') as string | null)?.trim() ?? '';
  if (!name) {
    redirect('/profile/household?error=name_required');
  }

  try {
    await createHousehold(user.id, name);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    redirect(`/profile/household?error=${encodeURIComponent(message)}`);
  }

  revalidatePath('/profile/household');
  redirect('/profile/household');
}

async function addMemberAction(formData: FormData) {
  'use server';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const householdId = formData.get('household_id') as string | null;
  const memberUserId = (formData.get('user_id') as string | null)?.trim();
  const role = (formData.get('role') as 'adult' | 'child' | null) ?? 'adult';

  if (!householdId || !memberUserId) {
    redirect('/profile/household?error=missing_field');
  }

  try {
    await addMember(householdId!, memberUserId!, role);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    redirect(`/profile/household?error=${encodeURIComponent(message)}`);
  }

  revalidatePath('/profile/household');
  redirect('/profile/household');
}

async function removeMemberAction(formData: FormData) {
  'use server';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const householdId = formData.get('household_id') as string | null;
  const memberUserId = formData.get('user_id') as string | null;

  if (!householdId || !memberUserId) {
    redirect('/profile/household?error=missing_field');
  }

  try {
    await removeMember(householdId!, memberUserId!);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    redirect(`/profile/household?error=${encodeURIComponent(message)}`);
  }

  revalidatePath('/profile/household');
  redirect('/profile/household');
}

/**
 * /profile/household — owner-side household management. If the user
 * doesn't own a household yet, shows the create form; otherwise shows
 * the member list with add/remove actions.
 *
 * Phase 8 uses raw user UUIDs for member adds — a full invite-by-email
 * flow lives in a future phase and would replace the user_id input
 * with a "send invite" form.
 */
export default async function HouseholdPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const household = await getOwnedHousehold(user.id);
  const members = household ? await listMembers(household.id) : [];

  return (
    <div className="space-y-6">
      {error ? (
        <p
          data-testid="household-error"
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          {decodeURIComponent(error)}
        </p>
      ) : null}

      {!household ? (
        <Card>
          <CardHeader>
            <CardTitle>Create a household</CardTitle>
            <CardDescription>
              A household lets you share Orvo Points, wallet credit,
              and bookings with the people you live with.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={createHouseholdAction}
              data-testid="household-create-form"
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Household name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="The Smiths"
                  className="max-w-xs"
                />
              </div>
              <div>
                <Button type="submit" size="lg">
                  Create household
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle data-testid="household-name">
                {household.name}
              </CardTitle>
              <CardDescription>
                You are the owner. Created{' '}
                {new Date(household.created_at).toLocaleDateString()}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-600">
                Members ({members.length})
              </h3>
              <ul
                data-testid="household-members"
                className="divide-y divide-zinc-200 rounded-lg border border-zinc-200"
              >
                {members.map((member) => {
                  const isOwner = member.role === 'owner';
                  return (
                    <li
                      key={member.id}
                      className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-mono text-xs text-zinc-700">
                          {member.user_id}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {ROLE_LABELS[member.role]} · joined{' '}
                          {new Date(member.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {isOwner ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          You
                        </span>
                      ) : (
                        <form action={removeMemberAction}>
                          <input
                            type="hidden"
                            name="household_id"
                            value={household.id}
                          />
                          <input
                            type="hidden"
                            name="user_id"
                            value={member.user_id}
                          />
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            data-testid={`remove-member-${member.user_id}`}
                          >
                            Remove
                          </Button>
                        </form>
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add a member</CardTitle>
              <CardDescription>
                Paste the Orvo user ID of the person you want to add.
                Email-based invites are coming in a later phase.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                action={addMemberAction}
                data-testid="household-add-form"
                className="flex flex-col gap-4 sm:flex-row sm:items-end"
              >
                <input
                  type="hidden"
                  name="household_id"
                  value={household.id}
                />
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="user_id">User ID</Label>
                  <Input
                    id="user_id"
                    name="user_id"
                    type="text"
                    required
                    placeholder="00000000-0000-0000-0000-000000000000"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:w-32">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    id="role"
                    name="role"
                    defaultValue="adult"
                  >
                    <option value="adult">Adult</option>
                    <option value="child">Child</option>
                  </Select>
                </div>
                <Button type="submit">Add</Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

/**
 * Household profile service (Phase 8.2).
 *
 * A household is a group of Orvo accounts that can share payment
 * methods, loyalty points, and notifications. One user creates the
 * household (the `owner_user_id`), then invites other users who are
 * added to `household_members` with a role: `owner`, `adult`, or
 * `child`.
 *
 * This service only manages the relationship graph — it does **not**
 * yet cascade existing bookings into the household (that's a
 * downstream decision). It exposes just enough for the profile UI to
 * render "your household" and "you are a member of X's household".
 *
 * RLS lets an owner read/write the household row and its members;
 * non-owner members can read the row and their own membership line.
 * See `007_super_app_profile_features.sql`.
 */
import { createAdminClient } from '@/lib/supabase/server';

export type HouseholdRole = 'owner' | 'adult' | 'child';

export interface Household {
  id: string;
  owner_user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: HouseholdRole;
  created_at: string;
}

export async function createHousehold(
  ownerUserId: string,
  name: string,
): Promise<Household> {
  if (!name.trim()) throw new Error('Household name is required');
  const admin = createAdminClient();

  const { data: household, error } = await admin
    .from('households')
    .insert({ owner_user_id: ownerUserId, name: name.trim() })
    .select('*')
    .single();
  if (error || !household) throw error ?? new Error('Failed to create household');

  // Owner is always a member with role = owner. Insert is idempotent
  // against the (household_id, user_id) unique index.
  await admin
    .from('household_members')
    .insert({
      household_id: household.id,
      user_id: ownerUserId,
      role: 'owner',
    });

  return household as Household;
}

export async function getOwnedHousehold(
  userId: string,
): Promise<Household | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('households')
    .select('*')
    .eq('owner_user_id', userId)
    .maybeSingle();
  return (data ?? null) as Household | null;
}

export async function listMembers(
  householdId: string,
): Promise<HouseholdMember[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('household_members')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });
  return (data ?? []) as HouseholdMember[];
}

export async function addMember(
  householdId: string,
  userId: string,
  role: HouseholdRole = 'adult',
): Promise<void> {
  if (role === 'owner') {
    throw new Error(
      'Only createHousehold can assign the owner role — transfer support is a future feature',
    );
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from('household_members')
    .insert({ household_id: householdId, user_id: userId, role });
  if (error) throw error;
}

export async function removeMember(
  householdId: string,
  userId: string,
): Promise<void> {
  const admin = createAdminClient();
  // Guard: don't let a caller remove the owner — that would orphan
  // the household. A full "transfer ownership" flow lives in a
  // future phase.
  const { data: household } = await admin
    .from('households')
    .select('owner_user_id')
    .eq('id', householdId)
    .single();
  if (household?.owner_user_id === userId) {
    throw new Error('Cannot remove the household owner');
  }
  const { error } = await admin
    .from('household_members')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', userId);
  if (error) throw error;
}

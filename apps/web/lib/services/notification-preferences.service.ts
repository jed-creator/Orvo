/**
 * Notification preferences service (Phase 8.5).
 *
 * Per-user, per-super-app-category opt-in matrix. Rows are sparse —
 * the DB only holds opt-OUT rows (plus any explicit opt-INs that
 * flipped back). `getPreferences` merges the sparse row set with
 * `DEFAULT_ENABLED = true` so the UI always sees the full matrix
 * and can render checkboxes without special-casing missing entries.
 *
 * Categories follow the super-app module keys plus two meta
 * categories (`promos`, `system`). Channels are push/email/sms.
 */
import { createAdminClient } from '@/lib/supabase/server';

export type NotificationChannel = 'push' | 'email' | 'sms';

export const NOTIFICATION_CATEGORIES = [
  'eat',
  'ride',
  'book',
  'trips',
  'tickets',
  'shop',
  'market',
  'compare',
  'promos',
  'system',
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_CHANNELS: readonly NotificationChannel[] = [
  'push',
  'email',
  'sms',
];

export interface PreferenceRow {
  category: NotificationCategory;
  channel: NotificationChannel;
  enabled: boolean;
}

/**
 * Returns the full (category × channel) matrix with defaults applied.
 * `system` defaults to ON always (transactional), everything else
 * defaults to ON unless the user has explicitly opted out.
 */
export async function getPreferences(
  userId: string,
): Promise<PreferenceRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('notification_preferences')
    .select('category, channel, enabled')
    .eq('user_id', userId);

  const overrides = new Map<string, boolean>();
  for (const row of data ?? []) {
    overrides.set(`${row.category}:${row.channel}`, row.enabled);
  }

  const matrix: PreferenceRow[] = [];
  for (const category of NOTIFICATION_CATEGORIES) {
    for (const channel of NOTIFICATION_CHANNELS) {
      const key = `${category}:${channel}`;
      matrix.push({
        category,
        channel,
        enabled: overrides.get(key) ?? true,
      });
    }
  }
  return matrix;
}

/**
 * Writes an explicit preference. Use this whenever a user toggles a
 * row — we upsert (so a single row per category/channel exists per
 * user) and never delete rows implicitly.
 */
export async function setPreference(
  userId: string,
  category: NotificationCategory,
  channel: NotificationChannel,
  enabled: boolean,
): Promise<void> {
  if (!NOTIFICATION_CATEGORIES.includes(category)) {
    throw new Error(`Unknown notification category: ${category}`);
  }
  if (!NOTIFICATION_CHANNELS.includes(channel)) {
    throw new Error(`Unknown notification channel: ${channel}`);
  }
  const admin = createAdminClient();
  const { error } = await admin.from('notification_preferences').upsert(
    {
      user_id: userId,
      category,
      channel,
      enabled,
    },
    { onConflict: 'user_id,category,channel' },
  );
  if (error) throw error;
}

/**
 * Gate used by notification-sending code: is this user opted-in for
 * this category/channel? Transactional sends (category = 'system')
 * always return `true` — you can't opt out of booking confirmations.
 */
export async function isOptedIn(
  userId: string,
  category: NotificationCategory,
  channel: NotificationChannel,
): Promise<boolean> {
  if (category === 'system') return true;
  const admin = createAdminClient();
  const { data } = await admin
    .from('notification_preferences')
    .select('enabled')
    .eq('user_id', userId)
    .eq('category', category)
    .eq('channel', channel)
    .maybeSingle();
  // Default ON when no explicit row exists.
  return data?.enabled ?? true;
}

/**
 * Accessibility settings service (Phase 8.6).
 *
 * One row per user, holding rendering preferences that affect every
 * Orvo surface (web + mobile). The UI reads this row at login and
 * applies it client-side — the server just owns the persistence.
 *
 * `getSettings` returns safe defaults if no row exists yet, so the
 * UI never has to branch on null. `upsertSettings` does a single
 * insert-or-update so there's only ever one row per user.
 */
import { createAdminClient } from '@/lib/supabase/server';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface AccessibilitySettings {
  theme: ThemePreference;
  font_scale: number;
  reduced_motion: boolean;
  high_contrast: boolean;
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  theme: 'system',
  font_scale: 1.0,
  reduced_motion: false,
  high_contrast: false,
};

export async function getSettings(
  userId: string,
): Promise<AccessibilitySettings> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('accessibility_settings')
    .select('theme, font_scale, reduced_motion, high_contrast')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return { ...DEFAULT_ACCESSIBILITY_SETTINGS };
  return {
    theme: data.theme as ThemePreference,
    font_scale: Number(data.font_scale),
    reduced_motion: Boolean(data.reduced_motion),
    high_contrast: Boolean(data.high_contrast),
  };
}

export async function upsertSettings(
  userId: string,
  patch: Partial<AccessibilitySettings>,
): Promise<AccessibilitySettings> {
  // Validate the inputs before writing so a bad client can't
  // slip a font_scale of 50 or a theme of "rainbow".
  const merged: AccessibilitySettings = {
    ...(await getSettings(userId)),
    ...patch,
  };
  if (!['system', 'light', 'dark'].includes(merged.theme)) {
    throw new Error(`Invalid theme: ${merged.theme}`);
  }
  if (merged.font_scale < 0.75 || merged.font_scale > 2.0) {
    throw new Error(
      `font_scale must be between 0.75 and 2.0 (received ${merged.font_scale})`,
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.from('accessibility_settings').upsert(
    {
      user_id: userId,
      theme: merged.theme,
      font_scale: merged.font_scale,
      reduced_motion: merged.reduced_motion,
      high_contrast: merged.high_contrast,
    },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
  return merged;
}

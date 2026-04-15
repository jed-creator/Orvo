import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  getSettings,
  upsertSettings,
  type ThemePreference,
} from '@/lib/services/accessibility.service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Accessibility' };

async function saveAccessibilityAction(formData: FormData) {
  'use server';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const theme = formData.get('theme') as ThemePreference | null;
  const fontScaleRaw = formData.get('font_scale');
  const reducedMotion = formData.get('reduced_motion') === 'on';
  const highContrast = formData.get('high_contrast') === 'on';

  const fontScale = Number(fontScaleRaw);
  if (!theme || Number.isNaN(fontScale)) {
    redirect('/profile/accessibility?error=invalid_form');
  }

  try {
    await upsertSettings(user.id, {
      theme: theme!,
      font_scale: fontScale,
      reduced_motion: reducedMotion,
      high_contrast: highContrast,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    redirect(
      `/profile/accessibility?error=${encodeURIComponent(message)}`,
    );
  }

  revalidatePath('/profile/accessibility');
  redirect('/profile/accessibility?saved=1');
}

/**
 * /profile/accessibility — single form mapped 1:1 to the
 * `accessibility_settings` row. The service applies validation so the
 * page just renders the form and the inline server action.
 */
export default async function AccessibilityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const settings = await getSettings(user.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accessibility</CardTitle>
        <CardDescription>
          Tune how Orvo looks and feels. Settings apply across web and
          mobile the next time you sign in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p
            data-testid="accessibility-error"
            className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          >
            Couldn&apos;t save your settings ({decodeURIComponent(error)}).
          </p>
        ) : null}
        {saved ? (
          <p
            data-testid="accessibility-saved"
            className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          >
            Settings saved.
          </p>
        ) : null}

        <form
          action={saveAccessibilityAction}
          data-testid="accessibility-form"
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              id="theme"
              name="theme"
              defaultValue={settings.theme}
              className="max-w-xs"
            >
              <option value="system">Match system</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="font_scale">
              Text size ({settings.font_scale.toFixed(2)}×)
            </Label>
            <input
              id="font_scale"
              name="font_scale"
              type="range"
              min="0.75"
              max="2"
              step="0.05"
              defaultValue={settings.font_scale}
              className="max-w-xs"
            />
            <p className="text-xs text-zinc-500">
              Range: 0.75× (compact) to 2× (large).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="reduced_motion"
              name="reduced_motion"
              type="checkbox"
              defaultChecked={settings.reduced_motion}
              className="h-4 w-4 rounded border-zinc-300 text-brand-primary focus:ring-brand-accent"
            />
            <Label htmlFor="reduced_motion" className="font-normal">
              Reduce motion (minimize transitions and animations)
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="high_contrast"
              name="high_contrast"
              type="checkbox"
              defaultChecked={settings.high_contrast}
              className="h-4 w-4 rounded border-zinc-300 text-brand-primary focus:ring-brand-accent"
            />
            <Label htmlFor="high_contrast" className="font-normal">
              High contrast mode
            </Label>
          </div>

          <div>
            <Button type="submit" size="lg">
              Save settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

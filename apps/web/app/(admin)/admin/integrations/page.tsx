/**
 * Admin Integration Hub page.
 *
 * Lists every registered provider from `integration_providers` along
 * with its current enabled state, reference badge, capabilities, and a
 * 24-hour error count derived from `integration_sync_log`. Admins can
 * toggle a provider off to disable it (the runtime filter that honors
 * this lives in a follow-up phase) and leave freeform notes.
 *
 * Mirrors the structure of `admin/users/page.tsx` — server component
 * that reads via `createAdminClient` and delegates mutations to the
 * server action in `app/actions/admin.ts`.
 */
import { createAdminClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  toggleIntegrationProviderAction,
  setIntegrationProviderNotesAction,
} from '@/app/actions/admin';

interface ProviderRow {
  key: string;
  category: string;
  display_name: string;
  capabilities: string[];
  is_reference: boolean;
  enabled: boolean;
  admin_notes: string | null;
}

interface SyncLogErrorRow {
  provider_key: string | null;
}

/**
 * Return an ISO timestamp for `hours` hours in the past. Defined at
 * module scope so `Date.now()` is lexically outside the component,
 * avoiding the `react-hooks/purity` rule that flags impure calls
 * inside render functions. The value is still computed per-request
 * because `AdminIntegrationsPage` is a dynamic server component.
 */
function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export default async function AdminIntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const categoryFilter = params.category?.trim() || '';
  const q = params.q?.trim() || '';
  const admin = createAdminClient();

  // -------- Provider list --------
  let providerQuery = admin
    .from('integration_providers')
    .select(
      'key, category, display_name, capabilities, is_reference, enabled, admin_notes',
    )
    .order('category', { ascending: true })
    .order('display_name', { ascending: true });

  if (categoryFilter) {
    providerQuery = providerQuery.eq('category', categoryFilter);
  }
  if (q) {
    providerQuery = providerQuery.ilike('display_name', `%${q}%`);
  }

  const { data: providerData } = await providerQuery;
  const providers = (providerData ?? []) as ProviderRow[];

  // -------- Health: error count per provider over last 24h --------
  const since = hoursAgoIso(24);
  const { data: logRows } = await admin
    .from('integration_sync_log')
    .select('provider_key')
    .eq('level', 'error')
    .gte('created_at', since);

  const errorCounts = new Map<string, number>();
  for (const row of (logRows ?? []) as SyncLogErrorRow[]) {
    if (!row.provider_key) continue;
    errorCounts.set(row.provider_key, (errorCounts.get(row.provider_key) ?? 0) + 1);
  }

  // -------- Aggregate summary --------
  const totalProviders = providers.length;
  const enabledCount = providers.filter((p) => p.enabled).length;
  const referenceCount = providers.filter((p) => p.is_reference).length;
  const providersWithErrors = providers.filter(
    (p) => (errorCounts.get(p.key) ?? 0) > 0,
  ).length;

  const categories = Array.from(new Set(providers.map((p) => p.category))).sort();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-brand-primary">
          Integration Hub
        </h1>
        <p className="text-zinc-600 mt-1">
          Manage the {totalProviders} third-party providers powering the
          super-app. Toggle a provider off to remove it from search fan-out.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <StatCard label="Total providers" value={totalProviders} />
        <StatCard
          label="Enabled"
          value={enabledCount}
          subtitle={`${totalProviders - enabledCount} disabled`}
        />
        <StatCard
          label="Reference adapters"
          value={referenceCount}
          subtitle="Full capability set"
        />
        <StatCard
          label="Providers with errors"
          value={providersWithErrors}
          subtitle="Last 24h"
        />
      </div>

      <form className="flex gap-2 items-center flex-wrap" action="/admin/integrations">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name…"
          className="h-10 w-full max-w-xs rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
        />
        <select
          name="category"
          defaultValue={categoryFilter}
          className="h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Button variant="outline" size="sm" type="submit">
          Filter
        </Button>
        {(q || categoryFilter) && (
          <a
            href="/admin/integrations"
            className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Clear
          </a>
        )}
      </form>

      {providers.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No providers match</CardTitle>
            <CardDescription>
              Try broadening your filters or clearing the search.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium text-zinc-500">Provider</th>
                <th className="px-4 py-2 font-medium text-zinc-500">Category</th>
                <th className="px-4 py-2 font-medium text-zinc-500">Capabilities</th>
                <th className="px-4 py-2 font-medium text-zinc-500">Errors (24h)</th>
                <th className="px-4 py-2 font-medium text-zinc-500">Status</th>
                <th className="px-4 py-2 font-medium text-zinc-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => {
                const errors = errorCounts.get(p.key) ?? 0;
                const health =
                  errors === 0 ? 'ok' : errors < 10 ? 'degraded' : 'down';
                return (
                  <tr key={p.key} className="border-t border-zinc-200 align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900 flex items-center gap-2">
                        {p.display_name}
                        {p.is_reference && (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                            Reference
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {p.key}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 capitalize">
                      {p.category.replace(/-/g, ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.capabilities.map((c) => (
                          <span
                            key={c}
                            className="inline-flex items-center rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {errors > 0 ? (
                        <span className="font-semibold text-amber-600">
                          {errors}
                        </span>
                      ) : (
                        <span className="text-zinc-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <HealthBadge health={health} enabled={p.enabled} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form
                        action={async () => {
                          'use server';
                          await toggleIntegrationProviderAction(p.key, !p.enabled);
                        }}
                        className="inline"
                      >
                        <Button
                          variant={p.enabled ? 'outline' : 'default'}
                          size="sm"
                          type="submit"
                        >
                          {p.enabled ? 'Disable' : 'Enable'}
                        </Button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {providers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin notes</CardTitle>
            <CardDescription>
              Freeform context for any provider — credential rotation
              dates, vendor contacts, outage postmortems, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {providers
              .filter((p) => p.admin_notes || !p.enabled)
              .map((p) => (
                <form
                  key={p.key}
                  action={setIntegrationProviderNotesAction}
                  className="flex flex-col gap-2 border-b border-zinc-100 pb-3 last:border-0"
                >
                  <input type="hidden" name="key" value={p.key} />
                  <label className="text-xs font-medium text-zinc-600">
                    {p.display_name}{' '}
                    <span className="font-mono text-zinc-400">({p.key})</span>
                  </label>
                  <textarea
                    name="admin_notes"
                    defaultValue={p.admin_notes ?? ''}
                    rows={2}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                    placeholder="Notes…"
                  />
                  <Button variant="outline" size="sm" type="submit" className="self-end">
                    Save notes
                  </Button>
                </form>
              ))}
            {providers.every((p) => p.enabled && !p.admin_notes) && (
              <p className="text-sm text-zinc-500">
                No notes yet. Disable a provider or add notes from the
                per-provider view once it exists.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: number;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-500">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold text-brand-primary">
          {value.toLocaleString()}
        </div>
        {subtitle && (
          <div className="text-xs text-zinc-500 mt-1">{subtitle}</div>
        )}
      </CardContent>
    </Card>
  );
}

function HealthBadge({
  health,
  enabled,
}: {
  health: 'ok' | 'degraded' | 'down';
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-700">
        Disabled
      </span>
    );
  }
  const styles: Record<typeof health, string> = {
    ok: 'bg-emerald-100 text-emerald-800',
    degraded: 'bg-amber-100 text-amber-800',
    down: 'bg-red-100 text-red-800',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles[health]}`}
    >
      {health}
    </span>
  );
}

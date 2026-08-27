import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, RefreshCw } from "@/lib/icons";
import { supabase } from "@/lib/supabase";
import {
  bulkAdjustAdminSignalPct,
  grantAdminUserSignal,
  setAdminUserSignalPct,
} from "@/lib/admin-api";
import { SIGNAL_PLANS, signalTierLabel } from "@/lib/signal-plans";
import { getSignalStrength } from "@/lib/signal-strength";
import type { TradingSignal } from "@/lib/signals";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, cn } from "@/lib/utils";

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  signal_pct: number;
  role: string;
};

type TabId = "allocation" | "desk";

const BULK_STEPS = [-10, -5, -1, 1, 5, 10] as const;
const QUICK_PCTS = [0, 25, 50, 75, 100] as const;

function formatPct(value: number) {
  return `${Number(value).toFixed(1)}%`;
}

export default function AdminSignalsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabId>("allocation");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [draftPct, setDraftPct] = useState<Record<string, string>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [grantUserId, setGrantUserId] = useState("");
  const [bulkNote, setBulkNote] = useState("Platform signal adjustment");
  const [grantDays, setGrantDays] = useState("30");
  const [grantTier, setGrantTier] = useState("starter");

  const [symbol, setSymbol] = useState("BTC/USD");
  const [direction, setDirection] = useState<"buy" | "sell">("buy");
  const [entry, setEntry] = useState("");
  const [target, setTarget] = useState("");
  const [stop, setStop] = useState("");
  const [minTier, setMinTier] = useState("starter");
  const [confidence, setConfidence] = useState("75");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [usersRes, signalsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, signal_pct, role")
        .neq("role", "admin")
        .order("email")
        .limit(300),
      supabase
        .from("trading_signals")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(40),
    ]);
    if (usersRes.error) setError(usersRes.error.message);
    else {
      const rows = (usersRes.data as UserRow[]) ?? [];
      setUsers(rows);
      setDraftPct(Object.fromEntries(rows.map((u) => [u.id, String(u.signal_pct ?? 0)])));
    }
    if (signalsRes.error) setError(signalsRes.error.message);
    else setSignals((signalsRes.data as TradingSignal[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const total = users.length;
    const avg = total ? users.reduce((s, u) => s + (u.signal_pct ?? 0), 0) / total : 0;
    const atZero = users.filter((u) => (u.signal_pct ?? 0) <= 0).length;
    const activeDesk = signals.filter((s) => s.status === "active").length;
    return { total, avg, atZero, activeDesk };
  }, [users, signals]);

  function setDraftForUser(userId: string, pct: string) {
    setDraftPct((prev) => ({ ...prev, [userId]: pct }));
  }

  function flash(msg: string) {
    setSuccess(msg);
    setError("");
  }

  async function runBulk(delta: number) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const data = await bulkAdjustAdminSignalPct({ delta, note: bulkNote });
      flash(`Adjusted ${data.users_updated ?? 0} users by ${delta > 0 ? "+" : ""}${delta}%.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk adjust failed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveUserPct(user: UserRow) {
    const pct = parseFloat(draftPct[user.id] ?? "0");
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      setError("Enter a percentage between 0 and 100.");
      return;
    }
    setSavingUserId(user.id);
    setError("");
    setSuccess("");
    try {
      await setAdminUserSignalPct({ userId: user.id, pct });
      flash(`Set ${user.email} to ${pct}%.`);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, signal_pct: pct } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update user.");
    } finally {
      setSavingUserId(null);
    }
  }

  async function grantPackage() {
    if (!grantUserId) {
      setError("Select a user for package access.");
      return;
    }
    const user = users.find((u) => u.id === grantUserId);
    const plan = SIGNAL_PLANS.find((p) => p.id === grantTier);
    if (!plan) return;
    const days = parseInt(grantDays, 10);
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await grantAdminUserSignal({
        userId: grantUserId,
        packageId: plan.id,
        packageName: plan.name,
        durationDays: Number.isFinite(days) ? days : 30,
      });
      flash(`Granted ${plan.name} to ${user?.email ?? "user"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Grant failed.");
    } finally {
      setBusy(false);
    }
  }

  async function publishSignal() {
    if (!entry.trim() || !target.trim() || !stop.trim()) {
      setError("Entry, target, and stop are required.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const { error: insertErr } = await supabase.from("trading_signals").insert({
        symbol: symbol.trim(),
        direction,
        entry_price: entry.trim(),
        target_price: target.trim(),
        stop_price: stop.trim(),
        min_tier: minTier,
        confidence: Math.min(100, Math.max(0, parseInt(confidence, 10) || 70)),
        notes: notes.trim() || null,
        status: "active",
      });
      if (insertErr) throw insertErr;
      flash("Signal published to the desk.");
      setEntry("");
      setTarget("");
      setStop("");
      setNotes("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish signal.");
    } finally {
      setBusy(false);
    }
  }

  async function closeSignal(id: string) {
    setBusy(true);
    setError("");
    try {
      const { error: updErr } = await supabase
        .from("trading_signals")
        .update({ status: "closed", closed_at: new Date().toISOString() })
        .eq("id", id);
      if (updErr) throw updErr;
      flash("Signal closed.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not close signal.");
    } finally {
      setBusy(false);
    }
  }

  const tabs: { id: TabId; label: string; hint: string }[] = [
    { id: "allocation", label: "User allocation", hint: "Set signal % shown on user dashboard" },
    { id: "desk", label: "Trading desk", hint: "Publish and manage desk signals" },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={t("admin.signalsTitle")}
        subtitle={t("admin.signalsSubtitle")}
        action={
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading || busy}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {(error || success) && (
        <p
          role={error ? "alert" : "status"}
          className={cn(
            "rounded-lg border px-4 py-3 text-sm",
            error
              ? "border-red-500/20 bg-red-500/5 text-red-400"
              : "border-emerald/30 bg-emerald/10 text-emerald"
          )}
        >
          {error || success}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Users", value: stats.total.toLocaleString() },
          { label: "Avg signal", value: formatPct(stats.avg) },
          { label: "At 0%", value: stats.atZero.toLocaleString() },
          { label: "Active desk", value: stats.activeDesk.toLocaleString() },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{item.label}</p>
            <p className="mt-1 font-display text-xl font-bold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-secondary/30 p-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                tab === item.id
                  ? "bg-surface-elevated text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">{tabs.find((item) => item.id === tab)?.hint}</p>
      </div>

      {tab === "allocation" && (
        <div className="space-y-4">
          <AdminPanel
            title="Bulk adjust everyone"
            description="Shift all non-admin users up or down (clamped 0–100%)."
            action={
              <div className="flex flex-wrap gap-2">
                {BULK_STEPS.map((step) => (
                  <Button
                    key={step}
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => void runBulk(step)}
                  >
                    {step > 0 && <Plus className="h-3 w-3" />}
                    {step > 0 ? "+" : ""}
                    {step}%
                  </Button>
                ))}
              </div>
            }
          >
            <div className="max-w-md">
              <Label>Bulk note</Label>
              <Input
                value={bulkNote}
                onChange={(e) => setBulkNote(e.target.value)}
                placeholder="Reason for team audit"
                className="mt-1.5"
              />
            </div>
          </AdminPanel>

          <AdminPanel
            title="All users"
            description="Set signal % for each user — no search needed."
            action={<p className="text-xs text-muted">{users.length} users</p>}
          >
            {loading ? (
              <div className="flex justify-center py-16">
                <RefreshCw className="h-6 w-6 animate-spin text-muted" />
              </div>
            ) : users.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted">No users found.</p>
            ) : (
              <>
                <div className="divide-y divide-border overflow-hidden rounded-xl border border-border lg:hidden">
                  {users.map((u) => {
                    const strength = getSignalStrength(u.signal_pct ?? 0);
                    const draft = draftPct[u.id] ?? String(u.signal_pct ?? 0);
                    const draftStrength = getSignalStrength(parseFloat(draft) || 0);
                    const isDirty = draft !== String(u.signal_pct ?? 0);
                    const saving = savingUserId === u.id;

                    return (
                      <div key={u.id} className="space-y-3 bg-surface-elevated/40 p-4">
                        <div>
                          <p className="font-medium text-foreground">{u.full_name || u.email}</p>
                          <p className="text-xs text-muted">{u.email}</p>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-muted">Current</p>
                            <p className="font-bold" style={{ color: strength.color }}>
                              {formatPct(u.signal_pct ?? 0)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] uppercase tracking-wide text-muted">Draft</p>
                            <p className="text-sm font-medium" style={{ color: draftStrength.color }}>
                              {draftStrength.label}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={draft}
                            onChange={(e) => setDraftForUser(u.id, e.target.value)}
                            className="h-10 w-24 rounded-lg border border-border bg-card px-2 font-mono text-foreground outline-none focus:border-emerald/40"
                          />
                          <div className="flex flex-1 flex-wrap gap-1">
                            {QUICK_PCTS.map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => setDraftForUser(u.id, String(pct))}
                                className={cn(
                                  "rounded border px-2 py-1 text-[11px] font-medium transition-colors",
                                  draft === String(pct)
                                    ? "border-emerald/40 bg-emerald/10 text-foreground"
                                    : "border-border text-muted"
                                )}
                              >
                                {pct}%
                              </button>
                            ))}
                          </div>
                        </div>
                        <Button
                          className="w-full"
                          size="sm"
                          variant={isDirty ? "default" : "outline"}
                          disabled={saving || busy}
                          onClick={() => void saveUserPct(u)}
                        >
                          {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                        </Button>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden overflow-hidden rounded-xl border border-border lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/40 text-[11px] uppercase tracking-wide text-muted">
                          <th className="px-4 py-3 font-medium">User</th>
                          <th className="px-4 py-3 font-medium">Current</th>
                          <th className="px-4 py-3 font-medium">New %</th>
                          <th className="px-4 py-3 font-medium">Quick set</th>
                          <th className="px-4 py-3 font-medium" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {users.map((u) => {
                          const strength = getSignalStrength(u.signal_pct ?? 0);
                          const draft = draftPct[u.id] ?? String(u.signal_pct ?? 0);
                          const draftStrength = getSignalStrength(parseFloat(draft) || 0);
                          const isDirty = draft !== String(u.signal_pct ?? 0);
                          const saving = savingUserId === u.id;

                          return (
                            <tr key={u.id} className="bg-surface-elevated/20 hover:bg-secondary/30">
                              <td className="px-4 py-3">
                                <p className="max-w-[200px] truncate font-medium text-foreground">
                                  {u.full_name || u.email}
                                </p>
                                <p className="max-w-[220px] truncate text-xs text-muted">{u.email}</p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-bold" style={{ color: strength.color }}>
                                  {formatPct(u.signal_pct ?? 0)}
                                </p>
                                <p className="text-[10px] text-muted">{strength.label}</p>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={draft}
                                    onChange={(e) => setDraftForUser(u.id, e.target.value)}
                                    className="h-9 w-20 rounded-lg border border-border bg-card px-2 text-sm font-mono text-foreground outline-none focus:border-emerald/40"
                                  />
                                  <span
                                    className="hidden text-xs font-medium sm:inline"
                                    style={{ color: draftStrength.color }}
                                  >
                                    {draftStrength.label}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {QUICK_PCTS.map((pct) => (
                                    <button
                                      key={pct}
                                      type="button"
                                      onClick={() => setDraftForUser(u.id, String(pct))}
                                      className={cn(
                                        "rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                                        draft === String(pct)
                                          ? "border-emerald/40 bg-emerald/10 text-foreground"
                                          : "border-border text-muted hover:bg-secondary"
                                      )}
                                    >
                                      {pct}%
                                    </button>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  size="sm"
                                  variant={isDirty ? "default" : "outline"}
                                  disabled={saving || busy}
                                  onClick={() => void saveUserPct(u)}
                                >
                                  {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </AdminPanel>
        </div>
      )}

      {tab === "desk" && (
        <div className="space-y-4">
          <AdminPanel
            title="Publish new signal"
            description="Optional desk feed for subscribed users. Most teams only need user allocation above."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Symbol</Label>
                <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>Direction</Label>
                <select
                  className="mt-1.5 h-12 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as "buy" | "sell")}
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
              <div>
                <Label>Entry</Label>
                <Input
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  placeholder="67250"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Target</Label>
                <Input
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="68500"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Stop</Label>
                <Input
                  value={stop}
                  onChange={(e) => setStop(e.target.value)}
                  placeholder="66500"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Min tier</Label>
                <select
                  className="mt-1.5 h-12 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                  value={minTier}
                  onChange={(e) => setMinTier(e.target.value)}
                >
                  {SIGNAL_PLANS.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                  <option value="basic">Basic (legacy)</option>
                  <option value="pro">Pro (legacy)</option>
                  <option value="vip">VIP (legacy)</option>
                </select>
              </div>
              <div>
                <Label>Confidence %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={confidence}
                  onChange={(e) => setConfidence(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="mt-3">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" />
            </div>
            <Button className="mt-4" disabled={busy} onClick={() => void publishSignal()}>
              Publish signal
            </Button>
          </AdminPanel>

          <AdminPanel
            title="Grant package access"
            description="Give a user free desk tier access for a limited time."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <Label>User</Label>
                <select
                  className="mt-1.5 h-12 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                  value={grantUserId}
                  onChange={(e) => setGrantUserId(e.target.value)}
                >
                  <option value="">Select user…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name ? `${u.full_name} (${u.email})` : u.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Tier</Label>
                <select
                  className="mt-1.5 h-12 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                  value={grantTier}
                  onChange={(e) => setGrantTier(e.target.value)}
                >
                  {SIGNAL_PLANS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Days</Label>
                <Input
                  type="number"
                  min={1}
                  value={grantDays}
                  onChange={(e) => setGrantDays(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <Button
              className="mt-4"
              variant="outline"
              disabled={busy || !grantUserId}
              onClick={() => void grantPackage()}
            >
              Grant access
            </Button>
          </AdminPanel>

          <AdminPanel title="Recent desk signals">
            {signals.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">No signals published yet.</p>
            ) : (
              <>
                <div className="divide-y divide-border overflow-hidden rounded-xl border border-border lg:hidden">
                  {signals.map((signal) => (
                    <div key={signal.id} className="space-y-3 bg-surface-elevated/40 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{signal.symbol}</p>
                          <p className="mt-1 text-xs text-muted">
                            <span className={signal.direction === "buy" ? "text-emerald" : "text-red-400"}>
                              {signal.direction.toUpperCase()}
                            </span>
                            {" · E "}
                            {signal.entry_price} · TP {signal.target_price} · SL {signal.stop_price}
                          </p>
                        </div>
                        <StatusBadge status={signal.status} />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                        <span>{signalTierLabel(signal.min_tier)}</span>
                        <span>{formatDate(signal.published_at)}</span>
                      </div>
                      {signal.status === "active" && (
                        <Button
                          className="w-full"
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => void closeSignal(signal.id)}
                        >
                          Close
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-hidden rounded-xl border border-border lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/40 text-[11px] uppercase tracking-wide text-muted">
                          <th className="px-4 py-3 font-medium">Pair</th>
                          <th className="px-4 py-3 font-medium">Setup</th>
                          <th className="px-4 py-3 font-medium">Tier</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Published</th>
                          <th className="px-4 py-3 font-medium" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {signals.map((signal) => (
                          <tr key={signal.id} className="bg-surface-elevated/20 hover:bg-secondary/30">
                            <td className="px-4 py-3 font-semibold text-foreground">{signal.symbol}</td>
                            <td className="px-4 py-3 text-xs text-muted">
                              <span className={signal.direction === "buy" ? "text-emerald" : "text-red-400"}>
                                {signal.direction.toUpperCase()}
                              </span>
                              {" · E "}
                              {signal.entry_price} · TP {signal.target_price} · SL {signal.stop_price}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted">
                              {signalTierLabel(signal.min_tier)}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={signal.status} />
                            </td>
                            <td className="px-4 py-3 text-xs text-muted">
                              {formatDate(signal.published_at)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {signal.status === "active" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => void closeSignal(signal.id)}
                                >
                                  Close
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </AdminPanel>
        </div>
      )}
    </div>
  );
}

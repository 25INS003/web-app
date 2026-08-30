"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, IndianRupee, Loader2, Percent, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Platform fee brackets.
 *
 * The whole ladder is edited locally and saved in one request, because the
 * server validates and stores it as a SET — "no overlaps", "one open-ended
 * bracket at the top" are properties of the collection, so saving rows one at
 * a time would have to pass through states that are individually fine and
 * collectively invalid.
 *
 * Amounts here are RUPEES; the API converts at its own boundary.
 */

const BLANK = {
    label: "",
    min_subtotal: 0,
    max_subtotal: null,
    fee_type: "fixed",
    fee_amount: 0,
    fee_percent: 0,
    min_fee: null,
    max_fee: null,
    is_active: true,
};

// Empty means "no limit" for max_subtotal and "unbounded" for the caps, which
// is a different thing from zero — hence null rather than 0.
const numOrNull = (v) => (v === "" || v === null ? null : Number(v));

export default function PlatformFeesPage() {
    const [tiers, setTiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const res = await apiClient.get("/admin/platform-fees");
                setTiers(res.data.data ?? []);
            } catch (e) {
                toast.error(
                    e.response?.data?.message || "Could not load the fee brackets."
                );
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const patch = (i, changes) =>
        setTiers((prev) => prev.map((t, n) => (n === i ? { ...t, ...changes } : t)));

    const addTier = () =>
        setTiers((prev) => {
            // A new bracket starts where the last one ended, which is the shape
            // that validates — contiguous and non-overlapping.
            const last = prev[prev.length - 1];
            const from = last?.max_subtotal ?? (last ? Number(last.min_subtotal) + 100 : 0);
            return [...prev, { ...BLANK, min_subtotal: from }];
        });

    const save = async () => {
        setSaving(true);
        setErrors([]);
        try {
            const res = await apiClient.put("/admin/platform-fees", {
                tiers: tiers.map((t) => ({
                    label: t.label,
                    min_subtotal: Number(t.min_subtotal) || 0,
                    max_subtotal: numOrNull(t.max_subtotal),
                    fee_type: t.fee_type,
                    fee_amount: Number(t.fee_amount) || 0,
                    fee_percent: Number(t.fee_percent) || 0,
                    min_fee: numOrNull(t.min_fee),
                    max_fee: numOrNull(t.max_fee),
                    is_active: t.is_active !== false,
                })),
            });
            setTiers(res.data.data ?? []);
            toast.success("Fee brackets saved");
        } catch (e) {
            // The server returns every problem in one response, so they are all
            // listed rather than surfaced one round trip at a time.
            const list = e.response?.data?.errors;
            setErrors(Array.isArray(list) && list.length ? list : [
                e.response?.data?.message || "Could not save the fee brackets.",
            ]);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading fee brackets…
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="container mx-auto max-w-5xl space-y-6 p-6"
        >
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-foreground">
                        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary shadow-lg shadow-primary/25">
                            <IndianRupee className="h-6 w-6 text-primary-foreground" />
                        </span>
                        Platform fees
                    </h1>
                    <p className="mt-2 max-w-2xl text-muted-foreground">
                        What the platform charges on an order, by basket size. Brackets
                        are matched on the items subtotal, before delivery. An order
                        outside every bracket is charged nothing.
                    </p>
                </div>

                <Button onClick={save} disabled={saving} className="rounded-xl px-5">
                    {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Save brackets
                </Button>
            </div>

            {errors.length > 0 && (
                <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <ul className="space-y-1 text-sm text-destructive">
                        {errors.map((e, i) => (
                            <li key={i}>{e}</li>
                        ))}
                    </ul>
                </div>
            )}

            {tiers.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
                    <h3 className="text-lg font-semibold text-foreground">
                        No platform fee
                    </h3>
                    <p className="mx-auto mt-2 mb-6 max-w-sm text-sm text-muted-foreground">
                        Nothing is charged on any order. Add a bracket to start.
                    </p>
                    <Button onClick={addTier} variant="outline" className="rounded-xl">
                        <Plus className="mr-2 h-4 w-4" /> Add a bracket
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {tiers.map((t, i) => (
                        <TierRow
                            key={i}
                            tier={t}
                            index={i}
                            onChange={(c) => patch(i, c)}
                            onRemove={() =>
                                setTiers((prev) => prev.filter((_, n) => n !== i))
                            }
                        />
                    ))}
                    <Button onClick={addTier} variant="outline" className="rounded-xl">
                        <Plus className="mr-2 h-4 w-4" /> Add a bracket
                    </Button>
                </div>
            )}
        </motion.div>
    );
}

function Field({ label, hint, children }) {
    return (
        <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            {children}
            {hint ? (
                <span className="text-[11px] text-muted-foreground">{hint}</span>
            ) : null}
        </label>
    );
}

const inputCls =
    "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

function TierRow({ tier, index, onChange, onRemove }) {
    const isPercent = tier.fee_type === "percent";

    return (
        <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-3">
                <Badge className="rounded-lg bg-muted text-muted-foreground text-[10px]">
                    Bracket {index + 1}
                </Badge>
                <input
                    value={tier.label ?? ""}
                    onChange={(e) => onChange({ label: e.target.value })}
                    placeholder="Name it, e.g. Small orders"
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
                />
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input
                        type="checkbox"
                        checked={tier.is_active !== false}
                        onChange={(e) => onChange({ is_active: e.target.checked })}
                    />
                    Active
                </label>
                <button
                    type="button"
                    onClick={onRemove}
                    aria-label={`Remove bracket ${index + 1}`}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Subtotal from (₹)">
                    <input
                        type="number"
                        min="0"
                        value={tier.min_subtotal ?? 0}
                        onChange={(e) => onChange({ min_subtotal: e.target.value })}
                        className={inputCls}
                    />
                </Field>

                <Field label="Subtotal up to (₹)" hint="Leave empty for no upper limit">
                    <input
                        type="number"
                        min="0"
                        value={tier.max_subtotal ?? ""}
                        onChange={(e) => onChange({ max_subtotal: e.target.value })}
                        placeholder="No limit"
                        className={inputCls}
                    />
                </Field>

                <Field label="Charge">
                    <select
                        value={tier.fee_type}
                        onChange={(e) => onChange({ fee_type: e.target.value })}
                        className={inputCls}
                    >
                        <option value="fixed">Fixed amount</option>
                        <option value="percent">Percentage of subtotal</option>
                    </select>
                </Field>

                {isPercent ? (
                    <Field label="Percent (%)">
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={tier.fee_percent ?? 0}
                                onChange={(e) => onChange({ fee_percent: e.target.value })}
                                className={inputCls}
                            />
                            <Percent className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </Field>
                ) : (
                    <Field label="Amount (₹)">
                        <input
                            type="number"
                            min="0"
                            value={tier.fee_amount ?? 0}
                            onChange={(e) => onChange({ fee_amount: e.target.value })}
                            className={inputCls}
                        />
                    </Field>
                )}
            </div>

            {isPercent && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="Never less than (₹)" hint="Optional floor">
                        <input
                            type="number"
                            min="0"
                            value={tier.min_fee ?? ""}
                            onChange={(e) => onChange({ min_fee: e.target.value })}
                            placeholder="No minimum"
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Never more than (₹)" hint="Optional cap">
                        <input
                            type="number"
                            min="0"
                            value={tier.max_fee ?? ""}
                            onChange={(e) => onChange({ max_fee: e.target.value })}
                            placeholder="No maximum"
                            className={inputCls}
                        />
                    </Field>
                </div>
            )}

            <p className="mt-3 text-xs text-muted-foreground">{describe(tier)}</p>
        </div>
    );
}

/** A plain-English restatement, so the effect is readable without arithmetic. */
function describe(t) {
    const from = `₹${Number(t.min_subtotal) || 0}`;
    const to =
        t.max_subtotal === null || t.max_subtotal === "" || t.max_subtotal === undefined
            ? "and above"
            : `to ₹${Number(t.max_subtotal)}`;

    if (t.is_active === false) return `Switched off — this bracket is skipped.`;

    if (t.fee_type === "percent") {
        const bounds = [];
        if (t.min_fee !== null && t.min_fee !== "" && t.min_fee !== undefined)
            bounds.push(`at least ₹${Number(t.min_fee)}`);
        if (t.max_fee !== null && t.max_fee !== "" && t.max_fee !== undefined)
            bounds.push(`at most ₹${Number(t.max_fee)}`);
        return `Orders ${from} ${to}: charge ${Number(t.fee_percent) || 0}% of the subtotal${
            bounds.length ? ` (${bounds.join(", ")})` : ""
        }.`;
    }
    const amount = Number(t.fee_amount) || 0;
    return `Orders ${from} ${to}: charge ${amount === 0 ? "nothing" : `₹${amount}`}.`;
}

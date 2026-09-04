"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Building2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";
import { Button } from "@/components/ui/button";

/**
 * The business's own details.
 *
 * These are printed at the head of every receipt a customer downloads. They
 * used to be constants inside the PDF builder, which made a changed address a
 * deploy; they are a row now, and this is the form for it.
 *
 * The whole form is sent on save, so what is on screen is what gets stored —
 * the server treats an omitted key as "leave it alone", which would make a
 * cleared box look saved and come back on the next load.
 */

const FIELDS = [
    {
        key: "app_name",
        label: "Business name",
        hint: "The name at the top of the receipt. Required.",
        placeholder: "Nedyway",
        wide: true,
    },
    {
        key: "tagline",
        label: "Strapline",
        hint: "One line under the name.",
        placeholder: "Fresh groceries, delivered.",
        wide: true,
    },
    {
        key: "company_address_line",
        label: "Address",
        placeholder: "Unit 214, Bahu Plaza, Gandhi Nagar",
        wide: true,
    },
    { key: "company_city", label: "City", placeholder: "Jammu" },
    { key: "company_state", label: "State", placeholder: "Jammu and Kashmir" },
    { key: "company_pincode", label: "PIN code", placeholder: "180004" },
    {
        key: "support_phone",
        label: "Phone",
        placeholder: "+91 191 000 0000",
    },
    {
        key: "contact_email",
        label: "Email",
        hint: "Where a customer writes about a bill.",
        placeholder: "support@nedyway.com",
        wide: true,
    },
];

const BLANK = Object.fromEntries(FIELDS.map((f) => [f.key, ""]));

const inputCls =
    "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

export default function BusinessSettingsPage() {
    const [form, setForm] = useState(BLANK);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const res = await apiClient.get("/admin/settings");
                // Nulls become empty strings: a controlled input handed null
                // flips to uncontrolled and React complains for the rest of the
                // page's life.
                const data = res.data.data ?? {};
                setForm({
                    ...BLANK,
                    ...Object.fromEntries(
                        FIELDS.map((f) => [f.key, data[f.key] ?? ""])
                    ),
                });
            } catch (e) {
                toast.error(
                    e.response?.data?.message || "Could not load the business details."
                );
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const save = async () => {
        setSaving(true);
        setErrors([]);
        try {
            const res = await apiClient.put("/admin/settings", form);
            const data = res.data.data ?? {};
            setForm({
                ...BLANK,
                ...Object.fromEntries(FIELDS.map((f) => [f.key, data[f.key] ?? ""])),
            });
            toast.success("Business details saved");
        } catch (e) {
            const list = e.response?.data?.errors;
            setErrors(
                Array.isArray(list) && list.length
                    ? list
                    : [e.response?.data?.message || "Could not save the details."]
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading business details…
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="container mx-auto max-w-3xl space-y-6 p-6"
        >
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-foreground">
                        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary shadow-lg shadow-primary/25">
                            <Building2 className="h-6 w-6 text-primary-foreground" />
                        </span>
                        Business details
                    </h1>
                    <p className="mt-2 max-w-2xl text-muted-foreground">
                        What a receipt says it was sent by. This appears at the head of
                        every bill a customer downloads.
                    </p>
                </div>

                <Button onClick={save} disabled={saving} className="rounded-xl px-5">
                    {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Save details
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

            <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3">
                {FIELDS.map((f) => (
                    <label
                        key={f.key}
                        className={`flex min-w-0 flex-col gap-1 ${
                            f.wide ? "sm:col-span-3" : ""
                        }`}
                    >
                        <span className="text-xs font-medium text-muted-foreground">
                            {f.label}
                        </span>
                        <input
                            value={form[f.key]}
                            placeholder={f.placeholder}
                            onChange={(e) =>
                                setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                            }
                            className={inputCls}
                        />
                        {f.hint ? (
                            <span className="text-[11px] text-muted-foreground">
                                {f.hint}
                            </span>
                        ) : null}
                    </label>
                ))}
            </div>

            {/* What the header will look like. The point of editing these is the
                document they end up on, and reading them back as a block is the
                quickest way to catch a line that has gone missing. */}
            <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    On the receipt
                </p>
                <p className="mt-3 text-xl font-semibold text-foreground">
                    {form.app_name || "Nedyway"}
                </p>
                <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                    {[
                        form.tagline,
                        form.company_address_line,
                        [
                            [form.company_city, form.company_state]
                                .filter(Boolean)
                                .join(", "),
                            form.company_pincode,
                        ]
                            .filter(Boolean)
                            .join(" "),
                        form.support_phone,
                        form.contact_email,
                    ]
                        .filter(Boolean)
                        .map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                </div>
            </div>
        </motion.div>
    );
}

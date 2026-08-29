"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { buildCategoryTree, findTreeNode } from "@/lib/categories/tree";

/**
 * Confirms a category delete, and collects what to do with its subcategories.
 *
 * Replaces a native `confirm()`, which could only ask yes/no and so had nothing
 * to send when the API started requiring an explicit choice — every delete of a
 * category with products beneath it failed with an unhandled AxiosError.
 *
 * The counts are computed from the store's flat list rather than fetched, so
 * the dialog describes the same tree the page is already showing.
 */
export function DeleteCategoryDialog({
    open,
    onOpenChange,
    category,
    categories,
    onConfirm,
}) {
    const [choice, setChoice] = useState("flatten");
    const [moveTo, setMoveTo] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const { childCount, descendantCount, descendantIds } = useMemo(() => {
        const tree = buildCategoryTree(categories ?? []);
        const node = category?.id ? findTreeNode(tree, category.id) : null;
        const ids = [];
        const walk = (nodes) =>
            nodes.forEach((n) => {
                ids.push(n.category.id);
                walk(n.children);
            });
        walk(node?.children ?? []);
        return {
            childCount: node?.children.length ?? 0,
            descendantCount: node?.descendantCount ?? 0,
            descendantIds: ids,
        };
    }, [categories, category?.id]);

    // A category cannot be re-homed under itself or under anything beneath it —
    // that would detach the branch from the tree entirely.
    const moveTargets = useMemo(
        () =>
            (categories ?? []).filter(
                (c) => c.id !== category?.id && !descendantIds.includes(c.id),
            ),
        [categories, category?.id, descendantIds],
    );

    const hasChildren = childCount > 0;
    const needsChoice = hasChildren;

    const handleConfirm = async () => {
        setError(null);
        if (choice === "move" && !moveTo) {
            setError("Pick a category to move the subcategories into.");
            return;
        }
        setBusy(true);
        try {
            await onConfirm(
                needsChoice
                    ? choice === "move"
                        ? { moveChildrenTo: moveTo }
                        : { flattenChildren: true }
                    : {},
            );
            onOpenChange(false);
        } catch (e) {
            // The server's refusal is the useful text — most often "this
            // category still has N products", which no choice here can fix.
            setError(e?.message || "Could not delete this category.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={busy ? undefined : onOpenChange}>
            <DialogContent className="sm:max-w-[520px] rounded-2xl border-slate-200 dark:border-slate-700">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 dark:bg-red-500/10">
                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </span>
                        Delete “{category?.name}”?
                    </DialogTitle>
                    <DialogDescription>
                        This cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                {hasChildren ? (
                    <div className="space-y-3">
                        <div className="flex gap-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                            <p className="text-sm text-amber-900 dark:text-amber-200">
                                It has {childCount} subcategor
                                {childCount === 1 ? "y" : "ies"}
                                {descendantCount > childCount
                                    ? ` (${descendantCount} in total, counting deeper levels)`
                                    : ""}
                                . They will not be deleted — choose where they go.
                            </p>
                        </div>

                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                            <input
                                type="radio"
                                name="delete-children"
                                className="mt-1"
                                checked={choice === "flatten"}
                                onChange={() => setChoice("flatten")}
                            />
                            <span className="text-sm">
                                <span className="font-medium text-slate-900 dark:text-white">
                                    Make them top-level categories
                                </span>
                                <span className="block text-slate-500 dark:text-slate-400">
                                    They keep their own products and subcategories.
                                </span>
                            </span>
                        </label>

                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                            <input
                                type="radio"
                                name="delete-children"
                                className="mt-1"
                                checked={choice === "move"}
                                onChange={() => setChoice("move")}
                            />
                            <span className="min-w-0 flex-1 text-sm">
                                <span className="font-medium text-slate-900 dark:text-white">
                                    Move them into another category
                                </span>
                                <select
                                    value={moveTo}
                                    onChange={(e) => {
                                        setMoveTo(e.target.value);
                                        setChoice("move");
                                    }}
                                    className="mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                                >
                                    <option value="">Select a category…</option>
                                    {moveTargets.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </span>
                        </label>
                    </div>
                ) : null}

                {error ? (
                    <p className="rounded-xl bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                        {error}
                    </p>
                ) : null}

                <DialogFooter>
                    <Button
                        variant="outline"
                        className="rounded-xl"
                        disabled={busy}
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        className="rounded-xl"
                        disabled={busy}
                        onClick={handleConfirm}
                    >
                        {busy ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

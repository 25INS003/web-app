"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, FolderTree, ImageIcon, Pencil, Plus } from "lucide-react";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { Badge } from "@/components/ui/badge";
import { buildCategoryTree, findTreeNode } from "@/lib/categories/tree";

/**
 * Everything beneath one category, as an expandable tree: its subcategories,
 * their subcategories, and so on to whatever depth exists.
 *
 * Built from the WHOLE category list and then narrowed to `rootId`, not from a
 * pre-filtered list. Filtering first would strip the ancestors the builder
 * needs to link rows together, and every descendant would come back looking
 * like an orphaned root.
 *
 * Derived from the store's flat `categories` via useMemo, so it has no fetch or
 * effect of its own: adding, renaming or deleting a category updates that array
 * and the tree re-derives. There is deliberately no second copy of the
 * hierarchy to keep in sync.
 */

const INDENT_PX = 24;

export function CategoryTree({ categories, rootId, onEdit, onAddSub }) {
    const children = useMemo(() => {
        const tree = buildCategoryTree(categories ?? []);
        return rootId ? (findTreeNode(tree, rootId)?.children ?? []) : tree;
    }, [categories, rootId]);

    // Keyed by id, not by position, so a row does not collapse when a sibling
    // is added above it.
    const [collapsed, setCollapsed] = useState(() => new Set());
    const toggle = (id) =>
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    if (!children.length) return null;

    // `depth` on a node is absolute within the full tree. Rendering a subtree
    // means subtracting the root's own level so the first row sits flush.
    const baseDepth = children[0].depth;

    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800/40">
            {children.map((node, i) => (
                <TreeRow
                    key={node.category.id}
                    node={node}
                    baseDepth={baseDepth}
                    collapsed={collapsed}
                    toggle={toggle}
                    onEdit={onEdit}
                    onAddSub={onAddSub}
                    isFirst={i === 0}
                />
            ))}
        </div>
    );
}

function TreeRow({
    node,
    baseDepth,
    collapsed,
    toggle,
    onEdit,
    onAddSub,
    isFirst,
}) {
    const router = useRouter();
    const { category, depth, children, descendantCount } = node;
    const hasChildren = children.length > 0;
    const isOpen = !collapsed.has(category.id);
    const level = depth - baseDepth;
    const imageUrl = category.image_url || category.image;

    return (
        <>
            <div
                onClick={() => router.push(`/admin/categories/${category.id}`)}
                className={`group flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    isFirst ? "" : "border-t border-slate-100 dark:border-slate-700/60"
                }`}
                style={{ paddingLeft: 12 + level * INDENT_PX }}
            >
                {/* Fixed-width slot even on leaves, so names stay aligned. */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (hasChildren) toggle(category.id);
                    }}
                    aria-label={
                        hasChildren
                            ? `${isOpen ? "Collapse" : "Expand"} ${category.name}`
                            : undefined
                    }
                    aria-expanded={hasChildren ? isOpen : undefined}
                    disabled={!hasChildren}
                    className="h-6 w-6 shrink-0 grid place-items-center rounded-md text-slate-400 disabled:opacity-0 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    <ChevronRight
                        className={`h-4 w-4 transition-transform duration-200 ${
                            isOpen ? "rotate-90" : ""
                        }`}
                    />
                </button>

                <div className="h-9 w-9 shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 grid place-items-center border border-slate-200 dark:border-slate-700">
                    {imageUrl ? (
                        <ProgressiveImage
                            src={imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    ) : hasChildren ? (
                        <FolderTree className="h-4 w-4 text-slate-400" />
                    ) : (
                        <ImageIcon className="h-4 w-4 text-slate-400" />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                        {category.name}
                    </p>
                    {category.description ? (
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {category.description}
                        </p>
                    ) : null}
                </div>

                {hasChildren ? (
                    <Badge className="shrink-0 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] px-2 py-0.5">
                        {children.length}
                        {descendantCount > children.length
                            ? ` / ${descendantCount}`
                            : ""}
                    </Badge>
                ) : null}

                {category.is_active === false ? (
                    <Badge className="shrink-0 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] px-2 py-0.5">
                        Inactive
                    </Badge>
                ) : null}

                <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddSub?.(category);
                        }}
                        aria-label={`Add subcategory to ${category.name}`}
                        className="h-7 w-7 grid place-items-center rounded-md text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(category);
                        }}
                        aria-label={`Edit ${category.name}`}
                        className="h-7 w-7 grid place-items-center rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {isOpen &&
                children.map((child) => (
                    <TreeRow
                        key={child.category.id}
                        node={child}
                        baseDepth={baseDepth}
                        collapsed={collapsed}
                        toggle={toggle}
                        onEdit={onEdit}
                        onAddSub={onAddSub}
                    />
                ))}
        </>
    );
}

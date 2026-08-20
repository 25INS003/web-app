/**
 * Walking the category tree.
 *
 * The category picker keeps a breadcrumb of the path to the selected node and
 * renders it with `key={category.id}`. It used to build that path by appending
 * the clicked category to whatever was already on screen, which is only
 * correct when the click is a step down from the current level — and it is
 * not always. Clicking the last breadcrumb entry (a leaf) left the list
 * showing the root categories while the breadcrumb still read
 * "Beverages / Juices", so the next click appended a root that was already in
 * the path and React saw two children with the same key.
 *
 * A path derived from the tree cannot repeat a node, which is why this lives
 * as a function over the data rather than as an accumulation of clicks.
 */

export type CategoryNode = {
  id: string;
  name?: string | null;
  parent_id?: string | null;
  /** The Mongo-era name. Still emitted by the legacy admin pages. */
  parent_category_id?: string | { id?: string } | null;
};

/**
 * A category's parent id, whichever name it arrived under.
 *
 * The column is `parent_id`. Reading only `parent_category_id` — which no row
 * the API returns actually has — meant every category looked like a root, and
 * the picker showed one flat list with no way to drill in.
 */
export const parentIdOf = (category: CategoryNode | null | undefined): string | null => {
  const parent = category?.parent_id ?? category?.parent_category_id;
  if (!parent) return null;
  if (typeof parent === "object") return parent.id ?? null;
  return parent;
};

/**
 * The path from the root down to `category`, inclusive.
 *
 * Returns `[]` for a missing category. A node that is its own ancestor stops
 * the walk instead of looping forever: bad data should render a short
 * breadcrumb, not hang the picker.
 */
export const categoryPath = (
  categories: CategoryNode[],
  category: CategoryNode | null | undefined,
): CategoryNode[] => {
  if (!category?.id) return [];
  const byId = new Map(categories.map((c) => [c.id, c]));
  const path: CategoryNode[] = [];
  const seen = new Set<string>();

  let node: CategoryNode | undefined | null = category;
  while (node?.id && !seen.has(node.id)) {
    seen.add(node.id);
    path.unshift(node);
    const parent = parentIdOf(node);
    node = parent ? byId.get(parent) : null;
  }
  return path;
};

/** The children of a category, or the roots when `parentId` is null. */
export const childrenOf = (
  categories: CategoryNode[],
  parentId: string | null,
): CategoryNode[] => categories.filter((c) => parentIdOf(c) === parentId);

/**
 * One entry per id, first occurrence winning.
 *
 * Applied wherever a list is about to be rendered with an id as its React key.
 * A duplicate key is not a cosmetic warning: React is then free to duplicate
 * or drop either row.
 */
export const dedupeById = <T extends { id?: string | null }>(rows: T[]): T[] => {
  if (!Array.isArray(rows)) return [];
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (!row?.id || seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
};

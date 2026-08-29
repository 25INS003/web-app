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

export type CategoryTreeNode<T> = {
  category: T;
  depth: number;
  children: CategoryTreeNode<T>[];
  /** Nodes at or below this one, excluding itself. */
  descendantCount: number;
};

/**
 * The flat category list as a nested tree, roots first.
 *
 * Built by linking ids in one pass rather than by filtering the whole list at
 * every level: the recursive-filter shape is O(n²) and, more importantly, has
 * no way to notice a node it never reached.
 *
 * Two kinds of bad data are handled rather than ignored, because both make
 * rows silently invisible — the worst outcome for an admin screen whose job is
 * to show you everything that exists:
 *
 *  - **Orphans.** A `parent_id` pointing at a row that isn't in the list (a
 *    deleted parent, or a filtered-out one) would leave the child attached to
 *    nothing and absent from the render. Orphans are promoted to roots.
 *  - **Cycles.** A → B → A never reaches a root, so neither node would appear.
 *    Any node not reachable from a root after the walk is promoted too, which
 *    breaks the cycle at an arbitrary but stable point instead of recursing
 *    forever.
 *
 * Sibling order follows the input, so the API's
 * `ORDER BY display_order, name, id` carries through at every level.
 */
export const buildCategoryTree = <T extends CategoryNode>(
  categories: T[],
): CategoryTreeNode<T>[] => {
  const rows = dedupeById(categories ?? []);
  const nodes = new Map<string, CategoryTreeNode<T>>();
  for (const category of rows) {
    nodes.set(category.id!, {
      category,
      depth: 0,
      children: [],
      descendantCount: 0,
    });
  }

  const roots: CategoryTreeNode<T>[] = [];
  for (const category of rows) {
    const node = nodes.get(category.id!)!;
    const parentId = parentIdOf(category);
    const parent = parentId ? nodes.get(parentId) : undefined;
    // Self-parented rows fall through to root here, before any linking.
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);
  }

  // Depth and descendant counts, plus cycle detection, in one walk from the
  // roots. `seen` spans the whole walk, so a node can only be visited once.
  const seen = new Set<string>();
  const visit = (node: CategoryTreeNode<T>, depth: number): number => {
    seen.add(node.category.id!);
    node.depth = depth;
    // Prune back-edges from `children` itself, not just from this walk. In a
    // cycle A -> B -> A neither node is a root, so the promotion pass below
    // enters at A; leaving B's link back to A in place would return a cyclic
    // structure that recurses forever in the RENDERER even if the walk here
    // guarded itself. In an acyclic list a child is never already seen when
    // its parent is visited, so this filter is a no-op.
    node.children = node.children.filter((c) => !seen.has(c.category.id!));
    let total = 0;
    for (const child of node.children) total += 1 + visit(child, depth + 1);
    node.descendantCount = total;
    return total;
  };
  for (const root of roots) visit(root, 0);

  // Anything the walk never reached is in a cycle. Promote it so it renders.
  for (const category of rows) {
    if (seen.has(category.id!)) continue;
    const node = nodes.get(category.id!)!;
    roots.push(node);
    visit(node, 0);
  }

  return roots;
};

/**
 * The subtree rooted at `categoryId`, or `null` if it isn't in the tree.
 *
 * Used to show one category's descendants without rebuilding a tree from a
 * filtered list — filtering first would strip the ancestors that
 * `buildCategoryTree` needs to link anything together, and every descendant
 * would come back as an orphan root.
 */
export const findTreeNode = <T extends CategoryNode>(
  nodes: CategoryTreeNode<T>[],
  categoryId: string,
): CategoryTreeNode<T> | null => {
  for (const node of nodes) {
    if (node.category.id === categoryId) return node;
    const hit = findTreeNode(node.children, categoryId);
    if (hit) return hit;
  }
  return null;
};

/** Every id on the path from a root down to `categoryId`, inclusive. */
export const ancestorIds = (
  categories: CategoryNode[],
  categoryId: string,
): string[] => {
  const target = categories.find((c) => c.id === categoryId);
  return categoryPath(categories, target).map((c) => c.id!);
};

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

import { describe, expect, it } from "vitest";
import type { CategoryNode, CategoryTreeNode } from "./tree";
import {
  ancestorIds,
  buildCategoryTree,
  categoryPath,
  childrenOf,
  dedupeById,
  findTreeNode,
  parentIdOf,
} from "./tree";

// Shaped like the real data: two levels, roots with parent_id null.
const BEVERAGES = { id: "bev", name: "Beverages", parent_id: null };
const JUICES = { id: "juice", name: "Juices", parent_id: "bev" };
const ORANGE = { id: "orange", name: "Orange", parent_id: "juice" };
const BAKERY = { id: "bakery", name: "Bakery", parent_id: null };
const TREE = [BEVERAGES, JUICES, ORANGE, BAKERY];

describe("parentIdOf", () => {
  it("reads the column, not the Mongo-era name", () => {
    expect(parentIdOf(JUICES)).toBe("bev");
    expect(parentIdOf(BEVERAGES)).toBeNull();
  });

  it("still accepts the legacy name the admin pages emit", () => {
    expect(parentIdOf({ id: "x", parent_category_id: "bev" })).toBe("bev");
    expect(parentIdOf({ id: "x", parent_category_id: { id: "bev" } })).toBe("bev");
  });
});

describe("categoryPath", () => {
  it("walks from the root down to the category", () => {
    expect(categoryPath(TREE, ORANGE).map((c) => c.id)).toEqual([
      "bev",
      "juice",
      "orange",
    ]);
    expect(categoryPath(TREE, BEVERAGES).map((c) => c.id)).toEqual(["bev"]);
  });

  it("never repeats a node, whatever was on screen before", () => {
    // The bug: the breadcrumb was built by appending each click to the
    // previous path, so "Beverages / Juices" plus a click on Beverages became
    // "Beverages / Juices / Beverages" — two children with the same key.
    // A path derived from the tree cannot express that.
    for (const node of TREE) {
      const ids = categoryPath(TREE, node).map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("stops on a parent cycle rather than looping forever", () => {
    // Bad data should render a short breadcrumb, not hang the picker.
    const a = { id: "a", parent_id: "b" };
    const b = { id: "b", parent_id: "a" };
    const path = categoryPath([a, b], a);
    expect(path.map((c) => c.id)).toEqual(["b", "a"]);
  });

  it("handles a self-parented category", () => {
    const self = { id: "s", parent_id: "s" };
    expect(categoryPath([self], self).map((c) => c.id)).toEqual(["s"]);
  });

  it("returns nothing for a missing category", () => {
    expect(categoryPath(TREE, null)).toEqual([]);
    expect(categoryPath(TREE, undefined)).toEqual([]);
  });
});

describe("childrenOf", () => {
  it("returns the roots for null", () => {
    expect(childrenOf(TREE, null).map((c) => c.id)).toEqual(["bev", "bakery"]);
  });

  it("returns a category's own children", () => {
    expect(childrenOf(TREE, "bev").map((c) => c.id)).toEqual(["juice"]);
    expect(childrenOf(TREE, "orange")).toEqual([]);
  });
});

describe("buildCategoryTree", () => {
  const ids = (nodes: CategoryTreeNode<CategoryNode>[]) =>
    nodes.map((n) => n.category.id);

  it("nests children under their parent, roots first", () => {
    const tree = buildCategoryTree(TREE);
    expect(ids(tree)).toEqual(["bev", "bakery"]);
    expect(ids(tree[0].children)).toEqual(["juice"]);
    expect(ids(tree[0].children[0].children)).toEqual(["orange"]);
  });

  it("records depth and descendant counts", () => {
    const [bev, bakery] = buildCategoryTree(TREE);
    expect(bev.depth).toBe(0);
    expect(bev.children[0].depth).toBe(1);
    expect(bev.children[0].children[0].depth).toBe(2);
    // Beverages has Juices and Orange beneath it, not just its one child.
    expect(bev.descendantCount).toBe(2);
    expect(bakery.descendantCount).toBe(0);
  });

  it("keeps sibling order, so display_order from the API carries through", () => {
    const a = { id: "a", parent_id: "bev" };
    const b = { id: "b", parent_id: "bev" };
    expect(ids(buildCategoryTree([BEVERAGES, b, a])[0].children)).toEqual([
      "b",
      "a",
    ]);
  });

  it("promotes an orphan to a root instead of dropping it", () => {
    // A child whose parent is not in the list — a deleted parent, or one the
    // caller filtered out. Attached to nothing, it would never render.
    const orphan = { id: "lost", parent_id: "gone" };
    const tree = buildCategoryTree([BAKERY, orphan]);
    expect(ids(tree)).toEqual(["bakery", "lost"]);
  });

  it("renders a cycle rather than looping or hiding it", () => {
    // A -> B -> A reaches no root, so neither node would appear at all.
    const a = { id: "a", parent_id: "b" };
    const b = { id: "b", parent_id: "a" };
    const tree = buildCategoryTree([a, b]);
    const rendered: (string | undefined)[] = [];
    const walk = (nodes: CategoryTreeNode<CategoryNode>[]) =>
      nodes.forEach((n) => {
        rendered.push(n.category.id);
        walk(n.children);
      });
    walk(tree);
    expect(new Set(rendered)).toEqual(new Set(["a", "b"]));
    expect(rendered.length).toBe(2); // visited once each, not repeatedly
  });

  it("treats a self-parented category as a root", () => {
    const self = { id: "s", parent_id: "s" };
    const tree = buildCategoryTree([self]);
    expect(ids(tree)).toEqual(["s"]);
    expect(tree[0].children).toEqual([]);
  });

  it("survives an empty or missing list", () => {
    expect(buildCategoryTree([])).toEqual([]);
    expect(buildCategoryTree(undefined as unknown as CategoryNode[])).toEqual([]);
  });

  it("does not duplicate a row that appears twice", () => {
    expect(ids(buildCategoryTree([BEVERAGES, BAKERY, BEVERAGES]))).toEqual([
      "bev",
      "bakery",
    ]);
  });
});

describe("findTreeNode", () => {
  it("finds a node at any depth", () => {
    const tree = buildCategoryTree(TREE);
    expect(findTreeNode(tree, "bev")?.category.name).toBe("Beverages");
    expect(findTreeNode(tree, "juice")?.category.name).toBe("Juices");
    expect(findTreeNode(tree, "orange")?.category.name).toBe("Orange");
  });

  it("returns the node with its children attached", () => {
    const tree = buildCategoryTree(TREE);
    const bev = findTreeNode(tree, "bev");
    expect(bev?.children.map((c) => c.category.id)).toEqual(["juice"]);
    expect(bev?.children[0].children.map((c) => c.category.id)).toEqual([
      "orange",
    ]);
  });

  it("returns null for an id that is not in the tree", () => {
    expect(findTreeNode(buildCategoryTree(TREE), "nope")).toBeNull();
  });
});

describe("ancestorIds", () => {
  it("returns the path from the root down to the category", () => {
    expect(ancestorIds(TREE, "orange")).toEqual(["bev", "juice", "orange"]);
    expect(ancestorIds(TREE, "bev")).toEqual(["bev"]);
  });

  it("returns nothing for an unknown id", () => {
    expect(ancestorIds(TREE, "nope")).toEqual([]);
  });
});

describe("dedupeById", () => {
  it("keeps one row per id", () => {
    expect(dedupeById([BEVERAGES, BAKERY, BEVERAGES]).map((c) => c.id)).toEqual([
      "bev",
      "bakery",
    ]);
  });

  it("drops rows with no id, which cannot be keyed anyway", () => {
    expect(dedupeById([{ id: "a" }, { id: null }, {}])).toEqual([{ id: "a" }]);
  });
});

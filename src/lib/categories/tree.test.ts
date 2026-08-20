import { describe, expect, it } from "vitest";
import {
  categoryPath,
  childrenOf,
  dedupeById,
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

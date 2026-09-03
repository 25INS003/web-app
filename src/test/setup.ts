import "@testing-library/jest-dom/vitest";

// jsdom implements neither of these, and Radix primitives reach for them on
// mount — `@radix-ui/react-use-size` constructs a ResizeObserver outright, so
// rendering anything containing a Checkbox or Select throws before a single
// assertion runs. Measurement is not what component tests are checking, so a
// pair of inert stubs is enough.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom has no IntersectionObserver either, and the catalogue's infinite scroll
// constructs one. The stub records its callback on the instance so a test can
// drive an intersection by hand — there is no scrolling in jsdom to trigger it.
if (!globalThis.IntersectionObserver) {
  globalThis.IntersectionObserver = class {
    static instances: Array<{ cb: (e: unknown[]) => void }> = [];
    cb: (e: unknown[]) => void;
    constructor(cb: (e: unknown[]) => void) {
      this.cb = cb;
      (globalThis.IntersectionObserver as unknown as typeof this.constructor & {
        instances: unknown[];
      }).instances.push(this);
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

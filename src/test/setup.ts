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

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

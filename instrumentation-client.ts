// Client instrumentation. Runs before hydration, on every page.
//
// Sole job today: stop React's dev-mode Server Component tracing from throwing
// a "Runtime TypeError" overlay over the app.
//
// React measures each Server Component's render onto the DevTools performance
// timeline. The timestamps arrive from the server and are rebased onto the
// browser's clock, so they can come out negative — React knows this and clamps
// for it, but only on one side:
//
//     performance.measure(measureName, {
//       start: 0 > startTime ? 0 : startTime,   // clamped
//       end:   childrenEndTime,                 // NOT clamped
//     });
//
// `childrenEndTime` is seeded `-Infinity` by `flushInitialRenderPerformance`,
// so a component whose subtree yields no child timings keeps that seed, and
// `measure()` rejects it:
//
//     TypeError: Failed to execute 'measure' on 'Performance':
//       '<zero-width space>AccountPage' cannot have a negative time stamp.
//
// The throw happens in a detached `setTimeout` 100ms after the RSC stream
// drains, so rendering and hydration have already finished and nothing is
// actually broken — but it is an uncaught exception, and Next's dev overlay
// covers the page with it.
//
// Verified against next@16.3.1 (the latest release at time of writing) as well
// as the pinned 16.3.0: the missing clamp is identical in both, so upgrading
// does not fix it. There is no configuration flag — React's tracing is enabled
// internally by Next and is not exposed.
//
// So the clamp is applied here instead, at the one API where the bug surfaces.
// Development only: the tracing lives in React's *.development.js bundles and
// never runs in a production build, so this shim would be dead weight there.
if (process.env.NODE_ENV !== "production") {
  const original = performance.measure.bind(performance);

  performance.measure = function patchedMeasure(
    name: string,
    startOrOptions?: string | PerformanceMeasureOptions,
    endMark?: string,
  ): PerformanceMeasure {
    // Only the options-object overload carries numeric timestamps. The
    // (name), (name, startMark) and (name, startMark, endMark) forms name
    // existing marks and are passed through untouched — rewriting those would
    // change which marks a measure refers to.
    if (
      startOrOptions &&
      typeof startOrOptions === "object" &&
      endMark === undefined
    ) {
      const options = startOrOptions;
      const start =
        typeof options.start === "number"
          ? Math.max(0, options.start)
          : options.start;
      let end =
        typeof options.end === "number"
          ? Math.max(0, options.end)
          : options.end;

      // Clamping the two independently can leave end before start — a
      // negative duration, which `measure` rejects just as firmly. Collapse
      // it to a zero-length entry rather than trading one throw for another.
      if (typeof start === "number" && typeof end === "number" && end < start) {
        end = start;
      }

      return original(name, { ...options, start, end });
    }

    return original(
      name,
      startOrOptions as string | undefined,
      endMark,
    ) as PerformanceMeasure;
  } as typeof performance.measure;
}

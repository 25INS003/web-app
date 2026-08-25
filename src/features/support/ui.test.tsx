import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AttachmentList } from "./ui";
import type { Attachment } from "@/lib/api/schemas/support";

// Rendering the files on a message.
//
// The case that broke it: the bucket deduplicates by content hash, so two
// files attached to one message come back sharing a single url whenever their
// bytes match — someone attaching the same photo twice, or two copies of a
// receipt saved under different names. Keying the list by url made React
// collide them ("Encountered two children with the same key") and drop one.

const file = (over: Partial<Attachment> = {}): Attachment => ({
  url: "http://bucket.test/support-attachments/t1/1_x_mug.png",
  name: "mug.png",
  mime_type: "image/png",
  size: 1024,
  ...over,
});

afterEach(() => vi.restoreAllMocks());

describe("AttachmentList", () => {
  it("renders both files when two of them share one url", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <AttachmentList
        attachments={[file(), file({ name: "mug2.png" })]}
      />,
    );

    // Both survive rendering...
    expect(screen.getAllByRole("img")).toHaveLength(2);
    // ...and React did not complain about the keys.
    const complaints = errors.mock.calls
      .map((args) => String(args[0]))
      .filter((m) => m.includes("same key"));
    expect(complaints).toEqual([]);
  });

  it("shows an image inline and a document as a named row", () => {
    render(
      <AttachmentList
        attachments={[
          file(),
          file({
            url: "http://bucket.test/t1/receipt.pdf",
            name: "receipt.pdf",
            mime_type: "application/pdf",
            size: 2048,
          }),
        ]}
      />,
    );

    // The photo is the point of attaching it, so it is visible without a
    // click; the pdf cannot be, so it gets its name instead.
    expect(screen.getByRole("img")).toHaveAttribute("alt", "mug.png");
    expect(screen.getByText("receipt.pdf")).toBeTruthy();
    expect(screen.getByText("2 KB")).toBeTruthy();
  });

  it("opens every attachment in a new tab", () => {
    // Losing an unsent reply to look at an attachment would be its own bug.
    render(<AttachmentList attachments={[file()]} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("renders nothing at all when there are none", () => {
    const { container } = render(<AttachmentList attachments={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

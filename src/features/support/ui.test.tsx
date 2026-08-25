import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import {
  AttachmentList,
  MAX_ATTACHMENT_MB,
  MAX_ATTACHMENTS,
  useAttachmentPicker,
} from "./ui";
import type { Attachment } from "@/lib/api/schemas/support";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

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

afterEach(() => {
  vi.mocked(toast.error).mockClear();
  vi.restoreAllMocks();
});

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

// The file picker's own limits.
//
// Enforced here as well as on the backend so the answer is instant: without
// this the only way to learn a file is too big is to upload it and be told
// afterwards — on a phone photo over a slow connection, the worst moment.

const bigFile = (name: string, mb: number) =>
  new File([new Uint8Array(mb * 1024 * 1024)], name, { type: "image/png" });

function Picker() {
  const { files, control, queue } = useAttachmentPicker();
  return (
    <div>
      {control}
      {queue}
      <output data-testid="count">{files.length}</output>
    </div>
  );
}

describe("useAttachmentPicker", () => {
  const pick = (container: HTMLElement, files: File[]) => {
    const input = container.querySelector("input[type=file]")!;
    fireEvent.change(input, { target: { files } });
  };

  it("keeps a file inside the limit", () => {
    const { container } = render(<Picker />);
    pick(container, [bigFile("small.png", 1)]);

    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("refuses one over the limit, and names it", () => {
    const { container } = render(<Picker />);
    pick(container, [bigFile("huge.png", MAX_ATTACHMENT_MB + 1)]);

    expect(screen.getByTestId("count").textContent).toBe("0");
    // Named, because "one of your files was too big" leaves someone removing
    // them one at a time to find out which.
    expect(vi.mocked(toast.error).mock.calls[0][0]).toContain("huge.png");
  });

  it("keeps the ones that fit when only some are too big", () => {
    const { container } = render(<Picker />);
    pick(container, [bigFile("ok.png", 1), bigFile("huge.png", MAX_ATTACHMENT_MB + 1)]);

    expect(screen.getByTestId("count").textContent).toBe("1");
  });

  it("stops at the per-message count and says so", () => {
    const { container } = render(<Picker />);
    pick(container, Array.from({ length: 7 }, (_, i) => bigFile(`p${i}.png`, 1)));

    expect(screen.getByTestId("count").textContent).toBe(String(MAX_ATTACHMENTS));
    expect(vi.mocked(toast.error).mock.calls.some(([m]) =>
      String(m).includes("per message"),
    )).toBe(true);
  });

  it("complains once per over-sized file, not twice", () => {
    // A toast fired from inside a setState updater is shown twice under
    // StrictMode, because React may run the updater twice.
    const { container } = render(<Picker />);
    pick(container, [bigFile("huge.png", MAX_ATTACHMENT_MB + 1)]);

    expect(vi.mocked(toast.error)).toHaveBeenCalledTimes(1);
  });
});

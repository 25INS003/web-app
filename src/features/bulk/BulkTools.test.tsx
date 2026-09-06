import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// next/link needs a router in a real app; here a plain anchor is enough to
// assert the href.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("./api", () => ({
  downloadCatalog: vi.fn(() => Promise.resolve()),
  downloadCatalogZip: vi.fn(() => Promise.resolve()),
  previewBulk: vi.fn(),
  importBulk: vi.fn(),
  rollbackImport: vi.fn(() => Promise.resolve({ deleted: 0, restored: 0 })),
  listImports: vi.fn(() =>
    Promise.resolve({
      imports: [
        {
          id: "batch-1",
          status: "imported",
          summary: { created: 2, updated: 1, failed: 0 },
          created_at: "2026-09-06T12:00:00.000Z",
          rolled_back_at: null,
        },
      ],
    }),
  ),
  getImport: vi.fn(() =>
    Promise.resolve({
      batch: {
        items: [
          {
            action: "created",
            product_id: "p1",
            name: "Eggs",
            skus: ["EGG-6"],
            variants: 1,
            exists: true,
          },
        ],
      },
    }),
  ),
}));

import { BulkTools } from "./BulkTools";
import * as api from "./api";

const renderTools = () =>
  render(
    <BulkTools
      shopId="s1"
      shopName="Green Basket"
      backHref="/products"
      productHref={(id) => `/products/s1/view/${id}`}
    />,
  );

describe("BulkTools", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the download options and loads import history on mount", async () => {
    renderTools();

    expect(
      screen.getByRole("button", { name: /ZIP with images/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Workbook only/i }),
    ).toBeInTheDocument();

    // History is fetched for this shop and rendered.
    expect(api.listImports).toHaveBeenCalledWith("s1");
    expect(await screen.findByText(/2 created/)).toBeInTheDocument();
  });

  it("downloads the ZIP when that button is clicked", async () => {
    renderTools();
    await screen.findByText(/2 created/); // let the mount fetch settle
    fireEvent.click(screen.getByRole("button", { name: /ZIP with images/i }));
    await vi.waitFor(() =>
      expect(api.downloadCatalogZip).toHaveBeenCalledWith("s1"),
    );
  });

  it("expands a history row and links products that exist", async () => {
    renderTools();

    // Open the row's detail.
    fireEvent.click(await screen.findByText(/2 created/));

    // Detail loads and the existing product is a link to its page.
    const link = await screen.findByRole("link", { name: "Eggs" });
    expect(api.getImport).toHaveBeenCalledWith("s1", "batch-1");
    expect(link).toHaveAttribute("href", "/products/s1/view/p1");
    expect(screen.getByText("EGG-6")).toBeInTheDocument();
  });
});

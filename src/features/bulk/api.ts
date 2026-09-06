// Bulk catalog API — upload a workbook (or a .zip of it + images) to preview or
// import, and download the shop's catalog as an editable .xlsx.
//
// All three endpoints are shop-scoped; the backend gates them the same way
// product writes are (shop owner → own shop, admin → any).

import { api } from "@/lib/api/client";
import { saveBlob } from "@/features/orders/saveBlob";

export type SheetError = { sheet: string; row: number; error: string };

export type PreviewRow = {
  handle: string;
  row: number;
  name: string | null;
  variants: number;
  action: "create" | "update";
  ok: boolean;
  errors: string[];
};

export type PreviewResult = {
  summary: {
    products: number;
    variants: number;
    valid: number;
    invalid: number;
    sheetErrors: number;
  };
  rows: PreviewRow[];
  sheetErrors: SheetError[];
};

export type ImportRow = {
  handle: string;
  row: number;
  status: "created" | "updated" | "failed" | "skipped";
  product_id?: string;
  variants?: number;
  errors?: string[];
};

export type ImportResult = {
  summary: { created: number; updated: number; failed: number; total: number };
  report: ImportRow[];
  sheetErrors: SheetError[];
};

const fileForm = (file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return fd;
};

export const previewBulk = (
  shopId: string,
  file: File,
  onProgress?: (percent: number) => void,
) =>
  api.upload<PreviewResult>(
    `/shops/${shopId}/products/bulk/preview`,
    fileForm(file),
    onProgress,
  );

export const importBulk = (
  shopId: string,
  file: File,
  onProgress?: (percent: number) => void,
) =>
  api.upload<ImportResult>(
    `/shops/${shopId}/products/bulk/import`,
    fileForm(file),
    onProgress,
  );

export const downloadCatalog = async (shopId: string) => {
  const blob = await api.download(`/shops/${shopId}/catalog.xlsx`);
  const stamp = new Date().toISOString().slice(0, 10);
  saveBlob(blob, `catalog-${stamp}.xlsx`);
};

/** The workbook plus an images/ folder of the actual image files. */
export const downloadCatalogZip = async (shopId: string) => {
  const blob = await api.download(`/shops/${shopId}/catalog.zip`);
  const stamp = new Date().toISOString().slice(0, 10);
  saveBlob(blob, `catalog-${stamp}.zip`);
};

export type ImportBatch = {
  id: string;
  status: "imported" | "rolled_back";
  summary: { created: number; updated: number; failed: number };
  created_at: string;
  rolled_back_at: string | null;
};

export const listImports = (shopId: string) =>
  api.get<{ imports: ImportBatch[] }>(`/shops/${shopId}/products/bulk/imports`);

export type ImportItemRow = {
  action: "created" | "updated";
  product_id: string;
  name: string | null;
  skus: string[];
  variants: number;
  exists: boolean;
};

export type ImportBatchDetail = ImportBatch & { items: ImportItemRow[] };

export const getImport = (shopId: string, batchId: string) =>
  api.get<{ batch: ImportBatchDetail }>(
    `/shops/${shopId}/products/bulk/imports/${batchId}`,
  );

export const rollbackImport = (shopId: string, batchId: string) =>
  api.post<{ deleted: number; restored: number; skipped: number }>(
    `/shops/${shopId}/products/bulk/rollback`,
    { batchId },
  );

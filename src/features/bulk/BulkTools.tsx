"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  History,
  Loader2,
  RotateCcw,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/types";
import {
  downloadCatalog,
  downloadCatalogZip,
  getImport,
  importBulk,
  listImports,
  previewBulk,
  rollbackImport,
  type ImportBatch,
  type ImportItemRow,
  type ImportResult,
  type PreviewResult,
} from "./api";

type Phase = "idle" | "previewing" | "previewed" | "importing" | "imported";

const errMessage = (e: unknown) =>
  e instanceof ApiError ? e.message : "Something went wrong. Please try again.";

export function BulkTools({
  shopId,
  shopName,
  backHref,
  productHref,
}: {
  shopId: string;
  shopName?: string;
  backHref: string;
  /** Builds the link to a product's page; existing products become clickable. */
  productHref?: (productId: string) => string;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const [downloading, setDownloading] = useState<null | "zip" | "xlsx">(null);
  const [history, setHistory] = useState<ImportBatch[]>([]);
  const [undoing, setUndoing] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, ImportItemRow[]>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleDetail = async (batchId: string) => {
    if (openId === batchId) {
      setOpenId(null);
      return;
    }
    setOpenId(batchId);
    if (!details[batchId]) {
      setLoadingDetail(batchId);
      try {
        const { batch } = await getImport(shopId, batchId);
        setDetails((d) => ({ ...d, [batchId]: batch.items }));
      } catch (e) {
        toast.error(errMessage(e));
        setOpenId(null);
      } finally {
        setLoadingDetail(null);
      }
    }
  };

  const refreshHistory = useCallback(async () => {
    try {
      const { imports } = await listImports(shopId);
      setHistory(imports);
    } catch {
      // History is a convenience; a failure here should not break the page.
    }
  }, [shopId]);

  // Load history on mount. State is set in the promise callback (not
  // synchronously in the effect body), which is the pattern the hooks lint wants.
  useEffect(() => {
    let active = true;
    listImports(shopId)
      .then(({ imports }) => {
        if (active) setHistory(imports);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [shopId]);

  const busy = phase === "previewing" || phase === "importing";

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setProgress(0);
    setPhase("idle");
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDownload = async (kind: "zip" | "xlsx") => {
    setDownloading(kind);
    try {
      if (kind === "zip") await downloadCatalogZip(shopId);
      else await downloadCatalog(shopId);
      toast.success("Catalog downloaded");
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setDownloading(null);
    }
  };

  const acceptFile = async (f: File) => {
    const ok = /\.(xlsx|zip)$/i.test(f.name);
    if (!ok) {
      toast.error("Choose a .xlsx workbook or a .zip of it.");
      return;
    }
    setFile(f);
    setResult(null);
    setPreview(null);
    setProgress(0);
    setPhase("previewing");
    try {
      const res = await previewBulk(shopId, f, setProgress);
      setPreview(res);
      setPhase("previewed");
      if (res.summary.valid === 0) {
        toast.error("No rows are ready to import — see the report below.");
      }
    } catch (e) {
      setPhase("idle");
      setFile(null);
      toast.error(errMessage(e));
    }
  };

  const onImport = async () => {
    if (!file) return;
    setProgress(0);
    setPhase("importing");
    try {
      const res = await importBulk(shopId, file, setProgress);
      setResult(res);
      setPhase("imported");
      const { created, updated, failed } = res.summary;
      if (failed) toast.warning(`Imported ${created + updated}, ${failed} failed`);
      else toast.success(`Imported ${created} new, updated ${updated}`);
      refreshHistory();
    } catch (e) {
      setPhase("previewed");
      toast.error(errMessage(e));
    }
  };

  const onUndo = async (batchId: string) => {
    setUndoing(batchId);
    try {
      const r = await rollbackImport(shopId, batchId);
      toast.success(
        `Rolled back — ${r.deleted} removed, ${r.restored} restored`,
      );
      await refreshHistory();
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setUndoing(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <Link
        href={backHref}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to products
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bulk catalog tools</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {shopName ? `${shopName} — ` : ""}download your catalog, edit it in Excel or
            Google Sheets, and upload it back.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onDownload("zip")} disabled={downloading !== null}>
            {downloading === "zip" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Download (ZIP with images)
          </Button>
          <Button
            variant="outline"
            onClick={() => onDownload("xlsx")}
            disabled={downloading !== null}
          >
            {downloading === "xlsx" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="size-4" />
            )}
            Workbook only (.xlsx)
          </Button>
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) acceptFile(f);
        }}
        className={cn(
          "rounded-2xl border-2 border-dashed p-8 text-center transition",
          dragging ? "border-primary bg-primary/5" : "border-border bg-card",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.zip,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) acceptFile(f);
          }}
        />
        <div className="grid place-items-center gap-3">
          <div className="grid size-12 place-items-center rounded-full bg-muted">
            <FileSpreadsheet className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {file ? file.name : "Drop your catalog file here"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              .xlsx workbook, or a .zip of the workbook plus an images/ folder for new photos
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            <Upload className="size-4" /> Choose file
          </Button>
        </div>

        {busy && (
          <div className="mx-auto mt-5 max-w-sm">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {phase === "previewing" ? "Checking your file…" : "Importing…"} {progress}%
            </p>
          </div>
        )}
      </div>

      {/* Preview report */}
      {preview && phase !== "imported" && (
        <section className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              <span className="font-semibold">{preview.summary.valid}</span> of{" "}
              <span className="font-semibold">{preview.summary.products}</span> products
              ready · {preview.summary.variants} variants
              {preview.summary.invalid > 0 && (
                <span className="text-destructive">
                  {" "}
                  · {preview.summary.invalid} with problems
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={reset} disabled={busy}>
                Clear
              </Button>
              <Button
                onClick={onImport}
                disabled={busy || preview.summary.valid === 0}
              >
                {phase === "importing" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                Import {preview.summary.valid} products
              </Button>
            </div>
          </div>

          <SheetErrors errors={preview.sheetErrors} />
          <ReportTable
            rows={preview.rows.map((r) => ({
              handle: r.handle,
              detail: r.name ?? "",
              badge: r.action,
              ok: r.ok,
              errors: r.errors,
            }))}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Shop-owner uploads enter the approval queue; existing products are matched by
            product_id / sku from a downloaded file.
          </p>
        </section>
      )}

      {/* Import result */}
      {result && (
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-3">
            <CheckCircle2 className="size-5 text-success" />
            <p className="text-sm">
              <span className="font-semibold">{result.summary.created}</span> created ·{" "}
              <span className="font-semibold">{result.summary.updated}</span> updated
              {result.summary.failed > 0 && (
                <span className="text-destructive">
                  {" "}
                  · {result.summary.failed} failed
                </span>
              )}
            </p>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={reset}>
              Upload another
            </Button>
          </div>
          <SheetErrors errors={result.sheetErrors} />
          <ReportTable
            rows={result.report.map((r) => ({
              handle: r.handle,
              detail: r.product_id ? `${r.variants ?? 0} variants` : "",
              badge: r.status,
              ok: r.status === "created" || r.status === "updated",
              errors: r.errors ?? [],
            }))}
          />
        </section>
      )}

      {/* Import history */}
      {history.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <History className="size-4" /> Import history
          </h2>
          <div className="overflow-hidden rounded-xl border border-border">
            {history.map((b) => {
              const undone = b.status === "rolled_back";
              const open = openId === b.id;
              return (
                <div key={b.id} className="border-b border-border last:border-b-0">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleDetail(b.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      aria-expanded={open}
                    >
                      {open ? (
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="min-w-0">
                        <span className="block text-sm">
                          <span className="font-medium">
                            {b.summary.created} created
                          </span>
                          {" · "}
                          {b.summary.updated} updated
                          {b.summary.failed
                            ? ` · ${b.summary.failed} failed`
                            : ""}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {new Date(b.created_at).toLocaleString()}
                        </span>
                      </span>
                    </button>
                    {undone ? (
                      <span className="text-xs text-muted-foreground">Undone</span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUndo(b.id)}
                        disabled={undoing !== null}
                      >
                        {undoing === b.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <RotateCcw className="size-4" />
                        )}
                        Undo
                      </Button>
                    )}
                  </div>

                  {open && (
                    <div className="border-t border-border bg-muted/30 px-4 py-3">
                      {loadingDetail === b.id ? (
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="size-3 animate-spin" /> Loading…
                        </p>
                      ) : details[b.id]?.length ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="text-left text-muted-foreground">
                              <tr>
                                <th className="py-1 pr-3 font-medium">Action</th>
                                <th className="py-1 pr-3 font-medium">Product</th>
                                <th className="py-1 font-medium">SKUs</th>
                              </tr>
                            </thead>
                            <tbody>
                              {details[b.id].map((it, i) => (
                                <tr
                                  key={i}
                                  className="border-t border-border/60"
                                >
                                  <td className="py-1 pr-3">
                                    <span
                                      className={cn(
                                        "rounded px-1.5 py-0.5",
                                        it.action === "created"
                                          ? "bg-success/10 text-success"
                                          : "bg-primary/10 text-primary",
                                      )}
                                    >
                                      {it.action}
                                    </span>
                                  </td>
                                  <td className="py-1 pr-3">
                                    {it.exists && productHref && it.name ? (
                                      <Link
                                        href={productHref(it.product_id)}
                                        className="text-primary hover:underline"
                                      >
                                        {it.name}
                                      </Link>
                                    ) : (
                                      (it.name ?? "—")
                                    )}
                                  </td>
                                  <td className="py-1 font-mono text-[11px] text-muted-foreground">
                                    {it.skus.join(", ")}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No product detail recorded for this import.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Undo deletes the products an import created and restores the ones it
            updated to their previous values.
          </p>
        </section>
      )}
    </div>
  );
}

function SheetErrors({ errors }: { errors: { sheet: string; row: number; error: string }[] }) {
  if (!errors?.length) return null;
  return (
    <div className="mb-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
      <p className="mb-1 font-medium text-destructive">File problems</p>
      <ul className="list-inside list-disc text-destructive/90">
        {errors.map((e, i) => (
          <li key={i}>
            {e.sheet} row {e.row}: {e.error}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReportTable({
  rows,
}: {
  rows: { handle: string; detail: string; badge: string; ok: boolean; errors: string[] }[];
}) {
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Handle</th>
            <th className="px-3 py-2 font-medium">Detail</th>
            <th className="px-3 py-2 font-medium">Action</th>
            <th className="px-3 py-2 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={`${r.handle}-${i}`} className={cn(!r.ok && "bg-destructive/5")}>
              <td className="px-3 py-2 font-mono text-xs">{r.handle}</td>
              <td className="px-3 py-2 text-muted-foreground">{r.detail}</td>
              <td className="px-3 py-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    r.ok
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  {r.ok ? (
                    <CheckCircle2 className="size-3" />
                  ) : (
                    <XCircle className="size-3" />
                  )}
                  {r.badge}
                </span>
              </td>
              <td className="px-3 py-2 text-xs text-destructive">
                {r.errors?.join("; ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

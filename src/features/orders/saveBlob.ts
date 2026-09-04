/**
 * Hand a blob to the browser as a download.
 *
 * The object URL is revoked afterwards. Without that every download leaks the
 * whole file for the lifetime of the tab — invisible with one receipt, less so
 * on an order history someone works through.
 */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

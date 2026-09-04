/**
 * Why an upload failed, in words the person who hit it can act on.
 *
 * The upload actions catch their own errors and report failure by returning
 * false, so the reason only survives if something puts it into words here. It
 * was being thrown away: every failed image upload, whatever the cause, reached
 * the screen as one fixed sentence about adding the picture from the edit page,
 * which tells someone what to do next but nothing about what went wrong — so a
 * file that would never upload got tried again and again.
 *
 * The two cases that matter most carry no JSON body at all, which is exactly
 * why they read as mysterious:
 *
 *   * 413 — the proxy refused the body before the API saw it, and answers with
 *     an HTML error page. `data.message` is undefined; the status is the only
 *     thing that says anything.
 *   * no response — the request never completed. axios gives a bare "Network
 *     Error" with no status, which is indistinguishable from a server fault
 *     unless it is named.
 */
export const uploadErrorMessage = (err) => {
  const said = err?.response?.data?.message;
  if (typeof said === "string" && said.trim()) return said;

  const status = err?.response?.status;
  if (status === 413) {
    return "That image is too large to upload. Try a smaller one, under 10 MB.";
  }
  if (status === 401 || status === 403) {
    return "You are not allowed to change this product's images.";
  }
  if (!err?.response) {
    return "The upload did not reach the server — check your connection and try again.";
  }
  return "The image could not be uploaded.";
};

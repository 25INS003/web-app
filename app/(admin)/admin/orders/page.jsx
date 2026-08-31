"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, PackageOpen, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Orders across every shop.
 *
 * Rows are SHOP orders rather than parent orders, matching the API: a
 * cancellation happens per shop, with its own reason and its own actor, so a
 * multi-shop basket half-cancelled by one merchant reads as exactly that
 * instead of collapsing into a single status.
 */

const FILTERS = [
  { key: "cancelled", label: "Cancelled" },
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "delivered", label: "Delivered" },
];

const STATUS_VARIANT = {
  cancelled: "destructive",
  delivered: "success",
  pending: "warning",
  refunded: "destructive",
};

const money = (n) =>
  typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "—";

export default function AdminOrdersPage() {
  // Cancelled first: this screen exists because a cancellation was previously
  // visible only to the shop and the customer.
  const [status, setStatus] = useState("cancelled");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await apiClient.get("/admin/orders", {
          params: { page, ...(status ? { status } : {}) },
        });
        if (!cancelled) setData(res.data.data);
      } catch (e) {
        if (!cancelled) {
          toast.error(e.response?.data?.message || "Could not load orders.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, page]);

  const orders = data?.orders ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto max-w-7xl space-y-6 p-6"
    >
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-foreground">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary shadow-lg shadow-primary/25">
            <ReceiptText className="h-6 w-6 text-primary-foreground" />
          </span>
          Orders
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every shop&apos;s orders. A cancelled order shows the note the shop
          gave the customer.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key || "all"}
            onClick={() => {
              setStatus(f.key);
              setPage(1);
            }}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              status === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading orders…
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
          <PackageOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-3 text-lg font-semibold text-foreground">
            Nothing here
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No {status || "the selected"} orders.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Shop</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((o) => (
                  <tr key={o.id} className="align-top">
                    <td className="px-4 py-3 font-mono text-xs">
                      {o.order_number}
                      {o.is_multi_shop ? (
                        <Badge className="ml-2 rounded-lg bg-muted text-[10px] text-muted-foreground">
                          multi-shop
                        </Badge>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{o.shop?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {[o.customer?.first_name, o.customer?.last_name]
                          .filter(Boolean)
                          .join(" ") ||
                          o.customer?.email ||
                          "Customer"}
                      </p>
                      {o.customer?.phone ? (
                        <p className="text-xs text-muted-foreground">
                          {o.customer.phone}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={STATUS_VARIANT[o.order_status] ?? "muted"}
                      >
                        {o.order_status}
                      </Badge>
                    </td>
                    <td className="max-w-sm px-4 py-3">
                      {o.cancellation_reason ? (
                        <>
                          <p className="text-foreground">
                            {o.cancellation_reason}
                          </p>
                          {o.cancelled_by ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              by {o.cancelled_by}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {money(o.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && data.pages > 1 ? (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {data.page} of {data.pages} · {data.total} orders
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={page >= data.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

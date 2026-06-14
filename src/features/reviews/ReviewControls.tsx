"use client";

import { useState } from "react";
import { ImagePlus, Pencil, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MyReview } from "@/lib/api/schemas/review";
import { cn } from "@/lib/utils";
import { useCreateReview, useDeleteReview, useUpdateReview } from "./hooks";

const MAX_IMAGES = 5;

function StarRating({
  value,
  onChange,
  readOnly,
  size = "size-5",
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: string;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-0.5" role={readOnly ? undefined : "radiogroup"}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          aria-checked={!readOnly && value === n}
          role={readOnly ? undefined : "radio"}
          className={cn(
            "transition",
            !readOnly && "cursor-pointer hover:scale-110",
            readOnly && "cursor-default",
          )}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
        >
          <Star
            className={cn(
              size,
              n <= shown
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({
  orderId,
  productId,
  existing,
  onDone,
}: {
  orderId: string;
  productId: string;
  existing?: MyReview;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [images, setImages] = useState<File[]>([]);
  const create = useCreateReview();
  const update = useUpdateReview();
  const pending = create.isPending || update.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) return;
    const opts = { onSuccess: onDone };
    if (existing) {
      update.mutate(
        { reviewId: existing._id, productId, rating, comment, images },
        opts,
      );
    } else {
      create.mutate({ orderId, productId, rating, comment, images }, opts);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mt-2 rounded-xl border border-border bg-background p-3"
    >
      <StarRating value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Share what you thought about this product (optional)"
        className="mt-3 w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground">
          <ImagePlus className="size-4" />
          {images.length > 0
            ? `${images.length} photo${images.length === 1 ? "" : "s"}`
            : "Add photos"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) =>
              setImages(Array.from(e.target.files ?? []).slice(0, MAX_IMAGES))
            }
          />
        </label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDone}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={pending || rating < 1}>
            {pending
              ? "Saving…"
              : existing
                ? "Update review"
                : "Submit review"}
          </Button>
        </div>
      </div>
    </form>
  );
}

/**
 * Per-item review control on a delivered order. Shows the existing review (with
 * edit/delete) or a prompt to write one. Renders nothing if there's no parent
 * product id to key the review to.
 */
export function OrderItemReview({
  orderId,
  productId,
  existing,
}: {
  orderId: string;
  productId?: string | null;
  existing?: MyReview;
}) {
  const [editing, setEditing] = useState(false);
  const del = useDeleteReview();

  if (!productId) return null;

  if (editing) {
    return (
      <ReviewForm
        orderId={orderId}
        productId={productId}
        existing={existing}
        onDone={() => setEditing(false)}
      />
    );
  }

  if (existing) {
    return (
      <div className="mt-2 flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-3">
        <div className="min-w-0">
          <StarRating value={existing.rating} readOnly size="size-4" />
          {existing.comment && (
            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
              {existing.comment}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            aria-label="Edit review"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={del.isPending}
            onClick={() => del.mutate({ reviewId: existing._id, productId })}
            aria-label="Delete review"
          >
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="mt-2"
      onClick={() => setEditing(true)}
    >
      <Star className="size-3.5" /> Write a review
    </Button>
  );
}

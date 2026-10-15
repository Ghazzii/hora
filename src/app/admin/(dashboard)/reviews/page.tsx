import Link from "next/link";
import { ReviewStatus } from "@prisma/client";
import { BadgeCheck, Star } from "lucide-react";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/dates";
import { moderateReviewAction } from "@/features/admin/actions";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { ReviewBadge } from "@/components/admin/StatusBadge";
import { cn } from "@/lib/utils";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const query = await searchParams;
  const status = Object.values(ReviewStatus).includes(query.status as ReviewStatus) ? (query.status as ReviewStatus) : ReviewStatus.PENDING;
  const [reviews, counts] = await Promise.all([
    db.review.findMany({ where: { status }, include: { product: { select: { id: true, nameFr: true } }, user: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.review.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const count = (value: ReviewStatus) => counts.find((row) => row.status === value)?._count._all ?? 0;

  return (
    <>
      <AdminPageHeader eyebrow="Community" title="Reviews" description="Reviews appear on product pages only once approved." />
      <nav className="mt-7 flex gap-1.5" aria-label="Filter by status">
        {Object.values(ReviewStatus).map((value) => (
          <Link key={value} href={`/admin/reviews?status=${value}`} aria-current={value === status ? "page" : undefined} className={cn("inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition", value === status ? "bg-ink text-white" : "bg-white text-ink/70 hover:text-ink")}>
            {value.charAt(0) + value.slice(1).toLowerCase()} <span className={cn("text-xs", value === status ? "text-white/60" : "text-ink/40")}>{count(value)}</span>
          </Link>
        ))}
      </nav>
      {reviews.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-ink/15 bg-white/50 px-6 py-16 text-center text-ink/55">{status === "PENDING" ? "All caught up — no reviews waiting." : "Nothing here."}</div>
      ) : (
        <ul className="mt-6 grid gap-4 lg:grid-cols-2">
          {reviews.map((review) => (
            <li key={review.id} className="admin-card flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <span className="flex gap-0.5" aria-label={`${review.rating} out of 5`}>{[1, 2, 3, 4, 5].map((index) => <Star key={index} size={15} className={index <= review.rating ? "fill-gold text-gold" : "text-ink/15"} />)}</span>
                <ReviewBadge status={review.status} />
              </div>
              <h2 className="mt-3 font-semibold">{review.title}</h2>
              <p className="mt-1.5 flex-1 text-sm leading-6 text-ink/65">{review.body}</p>
              <p className="mt-4 flex flex-wrap items-center gap-x-2 text-xs text-ink/50">
                <span className="font-semibold text-ink/70">{review.user.firstName} {review.user.lastName}</span>
                {review.verified && <span className="inline-flex items-center gap-1 text-emerald-800"><BadgeCheck size={13} /> Verified buyer</span>}
                · <Link href={`/admin/products/${review.product.id}`} className="hover:text-ink">{review.product.nameFr}</Link> · {timeAgo(review.createdAt)}
              </p>
              <ActionForm action={moderateReviewAction} className="mt-4 flex gap-2 border-t border-ink/[.06] pt-4">
                <input type="hidden" name="reviewId" value={review.id} />
                {review.status !== "APPROVED" && <SubmitButton name="status" value="APPROVED" className="btn h-9 bg-emerald-700 px-4 text-xs text-white hover:bg-emerald-800">Approve</SubmitButton>}
                {review.status !== "REJECTED" && <SubmitButton name="status" value="REJECTED" className="btn-outline h-9 px-4 text-xs">Reject</SubmitButton>}
                {review.status !== "PENDING" && <SubmitButton name="status" value="PENDING" className="btn-ghost h-9 px-3 text-xs">Back to pending</SubmitButton>}
              </ActionForm>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

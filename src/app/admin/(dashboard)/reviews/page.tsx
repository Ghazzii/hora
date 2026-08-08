import { ReviewStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { moderateReviewAction } from "@/features/admin/actions";
import { Badge } from "@/components/ui/Badge";

export default async function ReviewsPage() {
  const reviews = await db.review.findMany({ include: { product: true, user: true }, orderBy: { createdAt: "desc" } });
  return <><p className="eyebrow">Community</p><h1 className="mt-2 font-display text-4xl">Reviews</h1><div className="mt-7 grid gap-4">{reviews.map((review) => <article key={review.id} className="admin-card"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-gold-dark">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p><h2 className="mt-2 font-bold">{review.title} · {review.product.nameFr}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-black/65">{review.body}</p><p className="mt-3 text-xs text-black/45">{review.user.firstName} {review.user.lastName} · {review.verified ? "Verified" : "Unverified"}</p></div><Badge>{review.status}</Badge></div><form action={moderateReviewAction} className="mt-4 flex max-w-md gap-2"><input type="hidden" name="reviewId" value={review.id} /><select className="field" name="status" defaultValue={review.status}>{Object.values(ReviewStatus).map((status) => <option key={status}>{status}</option>)}</select><button className="bg-ink px-4 font-bold text-white">Save</button></form></article>)}</div></>;
}

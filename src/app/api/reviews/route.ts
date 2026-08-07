import { NextResponse } from "next/server";
import { Prisma, ReviewStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviewSchema } from "@/lib/validation";
export async function POST(request: Request) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 }); const parsed = reviewSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Invalid review" }, { status: 422 }); try { await db.review.create({ data: { ...parsed.data, userId: user.id, status: ReviewStatus.PENDING } }); return NextResponse.json({ ok: true }, { status: 201 }); } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "You already reviewed this product" }, { status: 409 }); throw error; } }

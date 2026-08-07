import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizeTunisianPhone } from "@/lib/phone";
import { serverEnv } from "@/lib/env";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

const SESSION_DAYS = 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function canAccessAdmin(
  user: { role: UserRole; active: boolean } | null | undefined,
) {
  return Boolean(user?.active && user.role === UserRole.ADMIN);
}

export async function createSession(userId: string) {
  serverEnv();
  const rawToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.session.create({
    data: { tokenHash: hashToken(rawToken), userId, expiresAt },
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date() || !session.user.active) {
    return null;
  }
  return session.user;
}

export async function requireUser(locale: "fr" | "en" = "fr") {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/compte/connexion`);
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!canAccessAdmin(user)) redirect("/admin/login");
  return user;
}

export async function authenticate(email: string, password: string) {
  const user = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user?.passwordHash || !user.active) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}

export async function registerCustomer(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const phone = normalizeTunisianPhone(input.phone);
  if (!phone) throw new Error("Invalid phone");
  return db.user.create({
    data: {
      email: input.email.trim().toLowerCase(),
      passwordHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone,
      role: UserRole.CUSTOMER,
    },
  });
}

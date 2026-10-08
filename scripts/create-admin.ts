import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(16).refine((value) => !/HoraAdmin|replace|password/i.test(value), "Use a unique admin password"),
  ADMIN_FIRST_NAME: z.string().min(1).default("Hora"),
  ADMIN_LAST_NAME: z.string().min(1).default("Admin"),
});

async function main() {
  const result = schema.safeParse(process.env);
  if (!result.success) throw new Error(result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", "));
  const input = result.data;
  const db = new PrismaClient();
  try {
    const email = input.ADMIN_EMAIL.trim().toLowerCase();
    if (await db.user.findUnique({ where: { email } })) throw new Error("This email already exists; admin creation does not replace existing accounts.");
    const passwordHash = await bcrypt.hash(input.ADMIN_PASSWORD, 12);
    await db.$transaction(async (tx) => {
      await tx.user.create({ data: {
        email, passwordHash,
        firstName: input.ADMIN_FIRST_NAME, lastName: input.ADMIN_LAST_NAME,
        role: UserRole.ADMIN, mustChangePassword: false,
      } });
      await tx.category.upsert({ where: { slugFr: "montres" }, update: {}, create: {
        nameFr: "Montres", nameEn: "Watches", slugFr: "montres", slugEn: "watches",
      } });
      await tx.user.updateMany({ where: {
        email: { in: ["admin@hora.tn", "client@hora.tn"], not: email },
      }, data: { active: false } });
    });
    console.log("Production administrator and default watch category created; known demo accounts disabled.");
  } finally { await db.$disconnect(); }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error && !("code" in error) ? error.message : "Administrator creation failed; check the database connection.");
  process.exitCode = 1;
});

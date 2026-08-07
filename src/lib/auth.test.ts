import { UserRole } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { canAccessAdmin } from "@/lib/auth";

describe("admin authorization", () => {
  it("requires an active admin", () => {
    expect(canAccessAdmin({ role: UserRole.ADMIN, active: true })).toBe(true);
    expect(canAccessAdmin({ role: UserRole.CUSTOMER, active: true })).toBe(false);
    expect(canAccessAdmin({ role: UserRole.ADMIN, active: false })).toBe(false);
    expect(canAccessAdmin(null)).toBe(false);
  });
});

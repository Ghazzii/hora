import { describe, expect, it } from "vitest";
import { orderWhere } from "./admin-orders";
import { formatTunisianPhone, whatsappLink } from "./phone";
import { safeRedirect } from "./utils";
import { tunisDay } from "./dates";

describe("admin order filters", () => {
  it("matches phones by national digits however they are typed", () => {
    const where = orderWhere({ q: "+216 22 555 666" });
    expect(where.OR).toContainEqual({ phone: { contains: "22555666" } });
  });
  it("ignores unknown statuses and malformed dates", () => {
    expect(orderWhere({ status: "DROP TABLE", from: "yesterday" })).toEqual({});
  });
  it("interprets date ranges as whole Tunis days", () => {
    const where = orderWhere({ from: "2026-10-01", to: "2026-10-01" });
    expect(where.createdAt).toEqual({ gte: new Date("2026-09-30T23:00:00Z"), lt: new Date("2026-10-01T23:00:00Z") });
  });
  it("can count every status for the tab bar", () => {
    expect(orderWhere({ status: "PENDING" }, { includeStatus: false })).toEqual({});
  });
});

describe("contact helpers", () => {
  it("builds WhatsApp links only for Tunisian numbers", () => {
    expect(whatsappLink("+21622555666", "Bonjour")).toBe("https://wa.me/21622555666?text=Bonjour");
    expect(whatsappLink("12345")).toBeNull();
    expect(formatTunisianPhone("22555666")).toBe("+216 22 555 666");
  });
});

describe("safe redirects", () => {
  it("allows same-site paths only", () => {
    expect(safeRedirect("/fr/montres/atlas?x=1", "/fr")).toBe("/fr/montres/atlas?x=1");
    for (const unsafe of ["//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)", undefined]) {
      expect(safeRedirect(unsafe, "/fr/compte")).toBe("/fr/compte");
    }
  });
});

describe("Tunis calendar days", () => {
  it("puts a late-evening UTC order on the next local day", () => {
    expect(tunisDay(new Date("2026-10-08T23:30:00Z"))).toBe("2026-10-09");
  });
});

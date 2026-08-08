import { describe, expect, it } from "vitest";
import { sanitizeAttribution } from "@/lib/attribution";

describe("attribution sanitization", () => {
  it("captures standard UTM values", () => {
    expect(
      sanitizeAttribution({
        utmSource: "Instagram",
        utmCampaign: "Summer",
        adId: "ad-42",
      }),
    ).toMatchObject({
      source: "instagram",
      utmSource: "Instagram",
      utmCampaign: "Summer",
      adId: "ad-42",
    });
  });

  it("removes controls and limits lengths", () => {
    const result = sanitizeAttribution({
      campaign: `safe\u0000${"x".repeat(500)}`,
    });
    expect(result.campaign).not.toContain("\u0000");
    expect(result.campaign?.length).toBeLessThanOrEqual(160);
  });

  it("defaults to direct", () => {
    expect(sanitizeAttribution(null)).toEqual({ source: "direct" });
  });
});

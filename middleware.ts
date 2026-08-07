import { NextRequest, NextResponse } from "next/server";
import { ATTRIBUTION_COOKIE_NAME } from "@/lib/constants";
import { sanitizeAttribution } from "@/lib/attribution";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const params = request.nextUrl.searchParams;
  const hasCampaignData = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "campaign_id",
    "ad_id",
    "adset_id",
  ].some((key) => params.has(key));

  if (hasCampaignData || !request.cookies.has(ATTRIBUTION_COOKIE_NAME)) {
    const attribution = sanitizeAttribution({
      utmSource: params.get("utm_source") ?? undefined,
      utmMedium: params.get("utm_medium") ?? undefined,
      utmCampaign: params.get("utm_campaign") ?? undefined,
      utmTerm: params.get("utm_term") ?? undefined,
      utmContent: params.get("utm_content") ?? undefined,
      campaignId: params.get("campaign_id") ?? undefined,
      adId: params.get("ad_id") ?? undefined,
      adSetId: params.get("adset_id") ?? undefined,
      referrer: request.headers.get("referer") ?? undefined,
      landingPage: request.nextUrl.pathname + request.nextUrl.search,
    });
    response.cookies.set(
      ATTRIBUTION_COOKIE_NAME,
      encodeURIComponent(JSON.stringify(attribution)),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      },
    );
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|robots.txt).*)"],
};

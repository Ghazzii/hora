"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { publicEnv } from "@/lib/env";

const CONSENT_KEY = "hora_meta_consent_v1";

export function MetaPixel() {
  const pixelId = /^[0-9]{5,30}$/.test(publicEnv.metaPixelId ?? "") ? publicEnv.metaPixelId : null;
  const [consent, setConsent] = useState<"accepted" | "rejected" | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!pixelId) return;
    try {
      const saved = localStorage.getItem(CONSENT_KEY);
      if (saved === "accepted" || saved === "rejected") {
        window.horaMetaConsent = saved === "accepted";
        setConsent(saved);
      }
      else setOpen(true);
    } catch {
      setOpen(true);
    }
    setReady(true);
  }, [pixelId]);

  if (!pixelId || !ready) return null;
  const french = document.documentElement.lang !== "en";

  function choose(value: "accepted" | "rejected") {
    try { localStorage.setItem(CONSENT_KEY, value); } catch { /* This choice remains active for the current visit. */ }
    window.horaMetaConsent = value === "accepted";
    if (value === "rejected") window.fbq?.("consent", "revoke");
    else if (window.fbq) { window.fbq("consent", "grant"); window.fbq("track", "PageView"); }
    setConsent(value);
    setOpen(false);
  }

  return <>
    {consent === "accepted" && <Script id="hora-meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');fbq('track','PageView');`}
    </Script>}
    {open ? <div role="dialog" aria-label={french ? "Préférences marketing" : "Marketing preferences"} className="fixed bottom-4 left-4 right-4 z-50 max-w-md rounded-xl border border-black/15 bg-white p-5 shadow-luxury sm:right-auto">
      <p className="font-semibold">{french ? "Préférences marketing" : "Marketing preferences"}</p>
      <p className="mt-2 text-sm leading-6 text-black/65">{french ? "Autorisez Meta Pixel à mesurer les visites et les achats. Vous pouvez refuser et continuer à utiliser Hora." : "Allow Meta Pixel to measure visits and shopping events. You can decline and still use Hora."}</p>
      <div className="mt-4 flex gap-3"><button type="button" className="min-h-11 flex-1 border border-black/20 px-4 text-sm font-semibold" onClick={() => choose("rejected")}>{french ? "Refuser" : "Decline"}</button><button type="button" className="min-h-11 flex-1 bg-ink px-4 text-sm font-semibold text-white" onClick={() => choose("accepted")}>{french ? "Autoriser" : "Allow"}</button></div>
    </div> : <button type="button" className="fixed bottom-3 left-3 z-40 rounded-full border border-black/20 bg-white px-3 py-2 text-xs shadow-sm" onClick={() => setOpen(true)}>{french ? "Préférences marketing" : "Marketing preferences"}</button>}
  </>;
}

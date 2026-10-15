"use client";

import { useEffect, useState, type CSSProperties } from "react";

const CENTER = { x: 200, y: 320 };
const origin: CSSProperties = { transformBox: "view-box", transformOrigin: `${CENTER.x}px ${CENTER.y}px` };

type Time = { hours: number; minutes: number; seconds: number };

function now(): Time {
  const date = new Date();
  return { hours: date.getHours(), minutes: date.getMinutes(), seconds: date.getSeconds() + date.getMilliseconds() / 1000 };
}

/** A gold watch whose hands show the visitor's real time. Renders 10:10 on the server. */
export function LiveWatch({ className, label }: { className?: string; label: string }) {
  const [time, setTime] = useState<Time>({ hours: 10, minutes: 10, seconds: 30 });
  // Fixed once: changing an animation's delay later would make the hand jump.
  const [secondDelay, setSecondDelay] = useState<number | null>(null);

  useEffect(() => {
    const current = now();
    setTime(current);
    setSecondDelay(current.seconds);
    const timer = window.setInterval(() => setTime(now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const hourAngle = ((time.hours % 12) + time.minutes / 60) * 30;
  const minuteAngle = (time.minutes + time.seconds / 60) * 6;
  const ticks = Array.from({ length: 60 }, (_, index) => index);

  return (
    <svg viewBox="0 0 400 640" className={className} role="img" aria-label={label}>
      <defs>
        <linearGradient id="lw-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FBF0C8" />
          <stop offset=".45" stopColor="#C9A646" />
          <stop offset="1" stopColor="#6E5413" />
        </linearGradient>
        <linearGradient id="lw-strap" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1a1612" />
          <stop offset=".5" stopColor="#3a2f24" />
          <stop offset="1" stopColor="#1a1612" />
        </linearGradient>
        <radialGradient id="lw-dial" cx=".5" cy=".42" r=".65">
          <stop offset="0" stopColor="#24211b" />
          <stop offset="1" stopColor="#070706" />
        </radialGradient>
        <filter id="lw-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="30" stdDeviation="26" floodOpacity=".55" />
        </filter>
      </defs>

      <g filter="url(#lw-shadow)">
        <rect x="138" y="0" width="124" height="190" rx="26" fill="url(#lw-strap)" />
        <rect x="138" y="450" width="124" height="190" rx="26" fill="url(#lw-strap)" />
        <path d="M150 12V178M250 12V178M150 462V628M250 462V628" stroke="#c9a646" strokeOpacity=".35" strokeWidth="1.5" strokeDasharray="5 6" />
        <rect x="126" y="150" width="148" height="60" rx="12" fill="url(#lw-gold)" />
        <rect x="126" y="430" width="148" height="60" rx="12" fill="url(#lw-gold)" />
        <rect x="344" y="304" width="22" height="32" rx="5" fill="url(#lw-gold)" />
        <circle cx={CENTER.x} cy={CENTER.y} r="152" fill="url(#lw-gold)" />
        <circle cx={CENTER.x} cy={CENTER.y} r="140" fill="#0b0b0a" />
        <circle cx={CENTER.x} cy={CENTER.y} r="131" fill="url(#lw-dial)" />
      </g>

      {ticks.map((tick) => {
        const hour = tick % 5 === 0;
        return (
          <rect
            key={tick}
            x={hour ? 197 : 199.25}
            y={CENTER.y - 124}
            width={hour ? 6 : 1.5}
            height={hour ? (tick === 0 ? 22 : 16) : 6}
            rx="1"
            fill={hour ? "#C9A646" : "#ffffff"}
            fillOpacity={hour ? 1 : 0.35}
            style={{ ...origin, transform: `rotate(${tick * 6}deg)` }}
          />
        );
      })}
      <text x={CENTER.x} y={CENTER.y - 52} textAnchor="middle" fill="#C9A646" fontFamily="var(--font-display), Georgia, serif" fontSize="30" letterSpacing="9">HORA</text>
      <text x={CENTER.x} y={CENTER.y + 66} textAnchor="middle" fill="#ffffff" fillOpacity=".45" fontFamily="var(--font-sans), Arial, sans-serif" fontSize="9" letterSpacing="5">TUNIS</text>

      <g className="watch-hand" style={{ ...origin, transform: `rotate(${hourAngle}deg)` }}>
        <path d={`M${CENTER.x - 5} ${CENTER.y + 14} L${CENTER.x - 3.5} ${CENTER.y - 70} L${CENTER.x} ${CENTER.y - 78} L${CENTER.x + 3.5} ${CENTER.y - 70} L${CENTER.x + 5} ${CENTER.y + 14} Z`} fill="url(#lw-gold)" />
      </g>
      <g className="watch-hand" style={{ ...origin, transform: `rotate(${minuteAngle}deg)` }}>
        <path d={`M${CENTER.x - 3.5} ${CENTER.y + 18} L${CENTER.x - 2.5} ${CENTER.y - 104} L${CENTER.x} ${CENTER.y - 112} L${CENTER.x + 2.5} ${CENTER.y - 104} L${CENTER.x + 3.5} ${CENTER.y + 18} Z`} fill="url(#lw-gold)" />
      </g>
      <g
        className={secondDelay !== null ? "watch-second" : undefined}
        style={{
          ...origin,
          ...(secondDelay !== null
            ? ({ "--second-delay": `-${secondDelay.toFixed(2)}s` } as CSSProperties)
            : { transform: `rotate(${time.seconds * 6}deg)` }),
        }}
      >
        <line x1={CENTER.x} y1={CENTER.y + 26} x2={CENTER.x} y2={CENTER.y - 118} stroke="#F3E8BE" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx={CENTER.x} cy={CENTER.y + 22} r="4" fill="#F3E8BE" />
      </g>
      <circle cx={CENTER.x} cy={CENTER.y} r="7" fill="url(#lw-gold)" />
      <circle cx={CENTER.x} cy={CENTER.y} r="2.5" fill="#0b0b0a" />
      <path d={`M${CENTER.x - 118} ${CENTER.y - 40} A131 131 0 0 1 ${CENTER.x + 40} ${CENTER.y - 124} A150 150 0 0 0 ${CENTER.x - 118} ${CENTER.y - 40} Z`} fill="#fff" fillOpacity=".07" />
    </svg>
  );
}

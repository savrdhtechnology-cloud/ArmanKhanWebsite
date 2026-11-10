'use client';

import { useEffect, useRef, useState } from 'react';
import { inr, Totals } from '../lib/data';

export interface Point { label: string; tip?: string; value: number }

function niceStep(max: number) { const raw = max / 4; const p = 10 ** Math.floor(Math.log10(raw || 1)); return [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw) || p; }
const short = (v: number) => (v >= 100000 ? `${Math.round(v / 10000) / 10}L` : v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v));

function useTip() {
  const box = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ i: number; x: number; y: number } | null>(null);
  const [w, setW] = useState(560);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const move = (i: number) => (e: React.PointerEvent) => { const b = box.current!.getBoundingClientRect(); setTip({ i, x: e.clientX - b.left, y: e.clientY - b.top }); };
  return { box, tip, move, w, clear: () => setTip(null) };
}

/** Line + soft area, one or two series on the same ₹ axis, with a crosshair tooltip. */
export function LineChart({ series, height = 200, fmt = inr }: { series: { name: string; color: string; points: Point[]; area?: boolean }[]; height?: number; fmt?: (v: number) => string }) {
  const { box, tip, move, clear, w } = useTip();
  const W = w, H = height, pl = 42, pb = 24, pt = 10, pr = 8;
  const n = series[0]?.points.length || 0;
  const max = Math.max(1, ...series.flatMap((s) => s.points.map((p) => p.value)));
  const step = niceStep(max); const top = Math.ceil(max / step) * step;
  const x = (i: number) => pl + (n <= 1 ? 0 : (i * (W - pl - pr)) / (n - 1));
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / top);
  const ticks: number[] = []; for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);
  const every = Math.max(1, Math.ceil(n / Math.max(3, Math.floor(W / 70))));
  const slot = (W - pl - pr) / Math.max(1, n - 1);
  return <div className="chart" ref={box} onPointerLeave={clear}>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={series.map((s) => s.name).join(' and ') + ' over time'}>
      <defs>{series.map((s, k) => <linearGradient key={k} id={`lg${k}-${s.name.replace(/\W/g, '')}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={s.color} stopOpacity="0.28" /><stop offset="100%" stopColor={s.color} stopOpacity="0" /></linearGradient>)}</defs>
      {ticks.map((v) => <g key={v}><line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke="var(--line-2)" /><text x={pl - 8} y={y(v) + 4} textAnchor="end">{v ? '₹' + short(v) : 0}</text></g>)}
      {series[0]?.points.map((p, i) => i % every === 0 && <text key={i} x={x(i)} y={H - 6} textAnchor="middle">{p.label}</text>)}
      {series.map((s, k) => {
        const d = s.points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ');
        return <g key={k}>
          {s.area && n > 1 && <path d={`${d} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={`url(#lg${k}-${s.name.replace(/\W/g, '')})`} />}
          <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
          {tip && <circle cx={x(tip.i)} cy={y(s.points[tip.i].value)} r={4} fill={s.color} stroke="var(--card)" strokeWidth={2} />}
        </g>;
      })}
      {tip && <line x1={x(tip.i)} x2={x(tip.i)} y1={pt} y2={H - pb} stroke="var(--faint)" strokeDasharray="3 3" />}
      {series[0]?.points.map((_, i) => <rect key={i} x={x(i) - slot / 2} y={pt} width={slot} height={H - pt - pb} fill="transparent" onPointerMove={move(i)} />)}
    </svg>
    {tip && <div className="tip" style={{ left: tip.x, top: tip.y }}><b>{series[0].points[tip.i].tip || series[0].points[tip.i].label}</b>{series.map((s) => <div key={s.name}>{s.name}: {fmt(s.points[tip.i].value)}</div>)}</div>}
  </div>;
}

/** Single-series bar chart with per-bar tooltip. */
export function BarChart({ data, color = 'var(--bar)', fmt = (v: number) => String(v), height = 200 }: { data: Point[]; color?: string; fmt?: (v: number) => string; height?: number }) {
  const { box, tip, move, clear, w } = useTip();
  const W = w, H = height, pl = 34, pb = 24, pt = 10;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = niceStep(max); const top = Math.ceil(max / step) * step;
  const bw = (W - pl) / Math.max(1, data.length); const barW = Math.max(4, Math.min(22, bw - 4));
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / top);
  const ticks: number[] = []; for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);
  const every = Math.max(1, Math.ceil(data.length / Math.max(3, Math.floor(W / 64))));
  return <div className="chart" ref={box} onPointerLeave={clear}>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bar chart">
      {ticks.map((v) => <g key={v}><line x1={pl} x2={W} y1={y(v)} y2={y(v)} stroke="var(--line-2)" /><text x={pl - 6} y={y(v) + 4} textAnchor="end">{short(v)}</text></g>)}
      {data.map((d, i) => {
        const x = pl + i * bw + (bw - barW) / 2, yy = y(d.value), hh = H - pb - yy;
        const r = Math.min(3, barW / 2, hh);
        const path = hh > 0 ? `M${x},${H - pb} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + barW - r} Q${x + barW},${yy} ${x + barW},${yy + r} V${H - pb} Z` : '';
        return <g key={i} onPointerMove={move(i)}>
          <rect x={pl + i * bw} y={pt} width={bw} height={H - pt - pb} fill="transparent" />
          {path && <path d={path} fill={color} opacity={tip && tip.i !== i ? 0.55 : 1} />}
          {i % every === 0 && <text x={x + barW / 2} y={H - 6} textAnchor="middle">{d.label}</text>}
        </g>;
      })}
    </svg>
    {tip && <div className="tip" style={{ left: tip.x, top: tip.y }}><b>{data[tip.i].tip || data[tip.i].label}</b><br />{fmt(data[tip.i].value)}</div>}
  </div>;
}

// gold family used by the mockups for the revenue mix; each slice is also labelled in the legend
export const GOLDS = ['#a8792a', '#c99a45', '#dcb86c', '#ead29a', '#f3e5c2'];

export function Donut({ parts, center, sub, size = 150 }: { parts: { label: string; value: number; color: string }[]; center: string; sub: string; size?: number }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  const R = 60, r = 42, C = 75;
  let a0 = -Math.PI / 2;
  const arcs = parts.filter((p) => p.value > 0).map((p) => {
    const a1 = a0 + (p.value / total) * Math.PI * 2 - 0.02;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const pt = (a: number, rad: number) => `${C + rad * Math.cos(a)},${C + rad * Math.sin(a)}`;
    const d = `M${pt(a0, R)} A${R},${R} 0 ${large} 1 ${pt(a1, R)} L${pt(a1, r)} A${r},${r} 0 ${large} 0 ${pt(a0, r)} Z`;
    a0 = a1 + 0.02;
    return { d, p };
  });
  return <svg viewBox="0 0 150 150" width={size} height={size} role="img" aria-label={`${sub}: ${center}`}>
    {arcs.length ? arcs.map((a) => <path key={a.p.label} d={a.d} fill={a.p.color}><title>{`${a.p.label}: ${Math.round((a.p.value / total) * 100)}%`}</title></path>) : <circle cx={C} cy={C} r={(R + r) / 2} fill="none" stroke="var(--line)" strokeWidth={R - r} />}
    <text x={C} y={C - 2} textAnchor="middle" style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 15, fontWeight: 700, fill: 'var(--text)' }}>{center}</text>
    <text x={C} y={C + 16} textAnchor="middle" style={{ fontSize: 10.5, fill: 'var(--muted)' }}>{sub}</text>
  </svg>;
}

export function DonutWithLegend({ parts, center, sub }: { parts: { label: string; value: number }[]; center: string; sub: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  const colored = parts.map((p, i) => ({ ...p, color: GOLDS[Math.min(i, GOLDS.length - 1)] }));
  return <div className="donut-wrap">
    <Donut parts={colored} center={center} sub={sub} />
    <div className="donut-legend">{colored.map((p) => <div key={p.label}><i style={{ background: p.color }} /><span>{p.label}</span><b className="num">{Math.round((p.value / total) * 100)}%</b></div>)}</div>
  </div>;
}

/** Half-ring gauge for a 0–100 score. */
export function Gauge({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  const a = Math.PI * (1 - v / 100);
  const R = 70, C = 85;
  const end = `${C + R * Math.cos(a)},${C - R * Math.sin(a)}`;
  return <svg viewBox="0 0 170 110" width={190} role="img" aria-label={`${label}: ${Math.round(v)}%`}>
    <defs><linearGradient id="gg" x1="0" x2="1"><stop offset="0%" stopColor="#a8792a" /><stop offset="100%" stopColor="#e7cb86" /></linearGradient></defs>
    <path d={`M${C - R},${C} A${R},${R} 0 0 1 ${C + R},${C}`} fill="none" stroke="var(--line-2)" strokeWidth={14} strokeLinecap="round" />
    {v > 0 && <path d={`M${C - R},${C} A${R},${R} 0 0 1 ${end}`} fill="none" stroke="url(#gg)" strokeWidth={14} strokeLinecap="round" />}
    <text x={C} y={C - 8} textAnchor="middle" style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 30, fontWeight: 700, fill: 'var(--text)' }}>{Math.round(v)}%</text>
    <text x={C} y={C + 16} textAnchor="middle" style={{ fontSize: 11.5, fill: 'var(--muted)' }}>{label}</text>
  </svg>;
}

// Fixed entity → colour mapping (validated categorical palette; never re-ordered).
export const SPLIT_KEYS = [
  { k: 'salonFee', label: 'Salon space fee', c: 'var(--s1)' },
  { k: 'arman', label: 'Arman contribution', c: 'var(--s2)' },
  { k: 'expertPay', label: 'Expert payout', c: 'var(--s3)' },
  { k: 'travel', label: 'Travel & operations', c: 'var(--s4)' },
  { k: 'products', label: 'Salon product charges', c: 'var(--s5)' },
] as const;

type SplitLike = Pick<Totals, 'salonFee' | 'arman' | 'expertPay' | 'travel' | 'products'>;
export function SplitBar({ t, total }: { t: SplitLike; total: number }) {
  const parts = SPLIT_KEYS.map((s) => ({ ...s, v: Math.max(0, t[s.k] || 0) }));
  const sum = parts.reduce((a, p) => a + p.v, 0) || 1;
  return <>
    <div className="splitbar" role="img" aria-label="Revenue split">{parts.map((p) => <div key={p.k} style={{ flex: p.v, background: p.c }} title={`${p.label}: ${inr(p.v)}`} />)}</div>
    <div className="split-legend">
      {parts.map((p) => <div className="li" key={p.k}><i style={{ background: p.c }} /><span>{p.label}</span><b className="num">{inr(p.v)}</b><span className="pct num">{Math.round((p.v / sum) * 100)}%</span></div>)}
      <div className="li" style={{ borderTop: '1px solid var(--line)', paddingTop: 8 }}><i /><b>Customer paid</b><b className="num">{inr(total)}</b><span className="pct" /></div>
    </div>
  </>;
}

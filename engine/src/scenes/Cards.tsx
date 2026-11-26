import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { AppIcon } from '../components/Chrome';
import { color, font } from '../theme';
import type { Assets, Carrier, Scene } from '../types';

const fadeUp = (frame: number, start: number, dur = 14) => ({
  opacity: interpolate(frame - start, [0, dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
  transform: `translateY(${interpolate(frame - start, [0, dur], [24, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) })}px)`,
});
const centre: React.CSSProperties = { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: font };

/** Emphasise the carrier name: "Automate your [UPS shipping] on Shopify" */
const Accent: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: color.accent }}>{children}</span>;

/** "UPS" -> "UPS shipping"; a name that already says it ("Amazon Shipping") is used as is. */
const shippingPhrase = (name: string) => (/\bshipping$/i.test(name.trim()) ? name.trim() : `${name} shipping`);

/** Accent the first of these phrases found in `line` (case-insensitive); the line unchanged if none. */
const AccentIn: React.FC<{ line: string; phrases: string[] }> = ({ line, phrases }) => {
  for (const p of phrases) {
    const i = line.toLowerCase().indexOf(p.toLowerCase());
    if (i >= 0) return <>{line.slice(0, i)}<Accent>{line.slice(i, i + p.length)}</Accent>{line.slice(i + p.length)}</>;
  }
  return <>{line}</>;
};

export const Hook: React.FC<{ carrier: Carrier }> = ({ carrier }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const M = 70; // safe margin, px
  const bubbleW = (t: string) => t.length * 34 * 0.56 + 60 + 24; // text + padding + rotation slack
  const spots = [[-2, 6], [50, 4], [30, 22], [72, 14], [8, 46], [62, 40], [20, 72], [58, 70]];
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: font, overflow: 'hidden' }}>
      {carrier.hookBubbles.map((b, i) => {
        const [x, y] = spots[i % spots.length];
        const delay = i * 5;
        const p = interpolate(frame - delay, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const drift = Math.sin((frame + i * 20) / 30) * 6;
        const light = i % 3 === 1;
        return (
          <div key={i} style={{
            position: 'absolute', left: Math.min(Math.max((x / 100) * width, M), width - M - bubbleW(b)), top: Math.min(Math.max((y / 100) * height, M), height - M - 80), transform: `translateY(${drift}px) rotate(${(i % 2 ? 1 : -1) * 4}deg) scale(${0.9 + 0.1 * p})`, opacity: p,
            padding: '16px 30px', borderRadius: 40, fontSize: 34, fontWeight: 500, whiteSpace: 'nowrap',
            background: light ? color.accentDim : '#2c3e66', color: '#fff', boxShadow: '0 12px 30px rgba(15,30,63,0.25)',
          }}>{b}</div>
        );
      })}
    </div>
  );
};

export const Title: React.FC<{ carrier: Carrier; assets: Assets }> = ({ carrier, assets }) => {
  const frame = useCurrentFrame();
  return (
    <div style={centre}>
      <div style={{ position: 'absolute', top: 140, fontSize: 68, fontWeight: 600, color: color.text, ...fadeUp(frame, 0) }}>
        Automate your <Accent>{shippingPhrase(carrier.name)}</Accent> on Shopify
      </div>
      <div style={{ ...fadeUp(frame, 12), background: '#fff', borderRadius: 999, padding: 22 }}>
        <AppIcon src={assets.appIcon} size={140} />
      </div>
      <div style={{ display: 'flex', gap: 18, marginTop: 40, ...fadeUp(frame, 24) }}>
        {carrier.titleChips.map((c) => (
          <div key={c} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: color.text, borderRadius: 14, padding: '12px 22px', fontSize: 24 }}>{c}</div>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 170, fontSize: 64, fontWeight: 600, color: color.text, ...fadeUp(frame, 40) }}>
        All from <Accent>one app.</Accent>
      </div>
    </div>
  );
};

export const ChapterCard: React.FC<{ n: number; total: number; title: string }> = ({ n, total, title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 200 } });
  return (
    <div style={{ ...centre, flexDirection: 'row', gap: 60 }}>
      <div style={{ fontSize: 260, fontWeight: 800, color: 'transparent', WebkitTextStroke: `4px ${color.accentDim}`, transform: `translateX(${(1 - s) * -80}px)`, opacity: s }}>
        {String(n).padStart(2, '0')}
      </div>
      <div>
        <div style={{ color: color.accent, fontSize: 24, fontWeight: 700, letterSpacing: 3, ...fadeUp(frame, 6) }}>
          STEP {String(n).padStart(2, '0')} OF {String(total).padStart(2, '0')}
        </div>
        <div style={{ color: color.text, fontSize: 64, fontWeight: 600, marginTop: 8, ...fadeUp(frame, 10) }}>{title}</div>
        <div style={{ width: interpolate(frame, [14, 30], [0, 90], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), height: 4, background: color.accent, marginTop: 18, borderRadius: 2 }} />
      </div>
    </div>
  );
};

export const Statement: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, mass: 0.6 } });
  return (
    <div style={centre}>
      <div style={{ background: color.card, color: color.cardText, borderRadius: 28, padding: '48px 80px', fontSize: 72, fontWeight: 700, transform: `scale(${0.85 + 0.15 * s})`, opacity: Math.min(1, s * 1.5), boxShadow: '0 30px 80px rgba(0,0,0,0.35)' }}>
        {text}
      </div>
    </div>
  );
};

export const Recap: React.FC<{ carrier: Carrier }> = ({ carrier }) => {
  const frame = useCurrentFrame();
  return (
    <div style={centre}>
      <div style={{ fontSize: 76, fontWeight: 600, color: color.text, ...fadeUp(frame, 0) }}>
        <AccentIn line={carrier.recapLine} phrases={[shippingPhrase(carrier.name), carrier.name]} />
      </div>
      <div style={{ width: interpolate(frame, [10, 50], [0, 1000], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), height: 3, background: `linear-gradient(90deg, ${color.accent}, rgba(0,211,232,0))`, marginTop: 50 }} />
    </div>
  );
};

export const AppCard: React.FC<{ carrier: Carrier; assets: Assets }> = ({ carrier, assets }) => {
  const frame = useCurrentFrame();
  const a = carrier.appCard;
  const row = (label: string, value: React.ReactNode) => (
    <div style={{ marginTop: 22 }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 20, color: '#444', marginTop: 4 }}>{value}</div>
    </div>
  );
  return (
    <div style={{ ...centre, flexDirection: 'row', gap: 90 }}>
      <div style={{ width: 520, background: '#fff', borderRadius: 24, padding: 40, color: '#111', fontFamily: font, ...fadeUp(frame, 0) }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <AppIcon src={assets.appIcon} size={72} />
          <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>PH MultiCarrier<br />Shipping Label</div>
        </div>
        {row('Pricing', a.price)}
        {row('Rating', `${a.rating} ★ (${a.reviews})`)}
        {row('Developer', <span style={{ color: '#2c6ecb' }}>{a.developer}</span>)}
        <div style={{ marginTop: 34, background: '#111', color: '#fff', borderRadius: 14, textAlign: 'center', padding: '16px 0', fontSize: 22, fontWeight: 600 }}>Install</div>
      </div>
      <div style={{ fontSize: 76, fontWeight: 600, color: color.text, lineHeight: 1.15, ...fadeUp(frame, 14) }}>
        Start your<br /><Accent>free trial</Accent> today.
      </div>
    </div>
  );
};

export const SupportCard: React.FC<{ carrier: Carrier }> = ({ carrier }) => {
  const frame = useCurrentFrame();
  return (
    <div style={centre}>
      <div style={{ width: 150, height: 150, borderRadius: 75, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', ...fadeUp(frame, 0) }}>
        <svg width="76" height="76" viewBox="0 0 24 24" fill="none" stroke={color.accentDim} strokeWidth="2" strokeLinecap="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z" /></svg>
      </div>
      <div style={{ fontSize: 72, fontWeight: 600, color: color.text, marginTop: 50, ...fadeUp(frame, 10) }}>
        Need help <Accent>setting up?</Accent>
      </div>
      <div style={{ fontSize: 32, color: color.textMuted, marginTop: 18, ...fadeUp(frame, 20) }}>Get a personalised onboarding session</div>
      <div style={{ fontSize: 34, color: color.accent, marginTop: 30, fontWeight: 600, ...fadeUp(frame, 30) }}>{carrier.supportUrl}</div>
    </div>
  );
};

/** Animated info card shown over a frozen screen. */
export const CalloutCard: React.FC<{ kind?: string }> = ({ kind }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  if (kind === 'label_ready') {
    return (
      <div style={centre}>
        <div style={{ transform: `scale(${0.8 + 0.2 * s})`, opacity: s, textAlign: 'center' }}>
          <svg width="260" height="220" viewBox="0 0 260 220">
            <path d="M30 70 L130 30 L230 70 L230 180 L130 215 L30 180 Z" fill="#c89b62" stroke="#8a6436" strokeWidth="4" />
            <path d="M30 70 L130 110 L230 70 M130 110 L130 215" stroke="#8a6436" strokeWidth="4" fill="none" />
            <rect x="150" y="125" width="62" height="44" rx="4" fill="#fff" transform="skewY(-20) translate(0,58)" opacity={interpolate(frame, [12, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
          </svg>
          <div style={{ fontSize: 60, fontWeight: 600, color: color.text, marginTop: 26 }}>Label on. <span style={{ color: color.accent }}>Ready to ship.</span></div>
        </div>
      </div>
    );
  }
  // paperless_invoice
  const dots = interpolate(frame, [10, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', right: 150, bottom: 150, width: 520, background: '#fff', borderRadius: 20, padding: 34, fontFamily: font, boxShadow: '0 30px 80px rgba(0,0,0,0.4)', transform: `translateY(${(1 - s) * 60}px)`, opacity: s }}>
      <div style={{ fontSize: 32, fontWeight: 700, color: color.cardText }}>Paperless Invoice</div>
      <div style={{ fontSize: 20, color: '#556', marginTop: 6 }}>Shipment data sent to customs electronically</div>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 30, gap: 14 }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: color.cardText }} />
        <div style={{ flex: 1, height: 4, backgroundImage: `linear-gradient(90deg, ${color.accentDim} 50%, transparent 50%)`, backgroundSize: '14px 4px', clipPath: `inset(0 ${100 - dots * 100}% 0 0)` }} />
        <div style={{ width: 64, height: 64, borderRadius: 32, background: color.accentDim, opacity: dots }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, color: '#556', marginTop: 8 }}><span>Invoice</span><span>Customs</span></div>
    </div>
  );
};

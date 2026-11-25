import React from 'react';
import { Img, staticFile } from 'remotion';
import { color, font } from '../theme';

const Hex: React.FC<{ size: number; stroke: string }> = ({ size, stroke }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth={3}>
    <path d="M20 3l7 4v8l-7 4-7-4V7z" />
    <path d="M12 17l7 4v8l-7 4-7-4v-8z" />
    <path d="M28 17l7 4v8l-7 4-7-4v-8z" />
  </svg>
);

/** PluginHive logo, top-right. Uses brand/logos/pluginhive.png when present, else a text placeholder. */
export const PluginHiveLogo: React.FC<{ src?: string; dark?: boolean }> = ({ src, dark }) => (
  <div style={{ position: 'absolute', right: 48, top: 30, height: 34, display: 'flex', alignItems: 'center', gap: 6 }}>
    {src ? (
      <Img src={staticFile(src)} style={{ height: 34 }} />
    ) : (
      <>
        <Hex size={30} stroke={dark ? color.cardText : color.text} />
        <span style={{ fontFamily: font, fontWeight: 800, fontSize: 21, letterSpacing: 0.5, color: dark ? color.cardText : color.text }}>
          PLUGIN<span style={{ color: color.accentDim }}>HIVE</span>
        </span>
      </>
    )}
  </div>
);

/** Shopify logo next to PluginHive's. brand/logos/shopify.png when present, else the bag icon + the name in white. */
export const ShopifyLogo: React.FC<{ src?: string; bag?: string }> = ({ src, bag }) => (
  <div style={{ position: 'absolute', right: 270, top: 30, height: 34, display: 'flex', alignItems: 'center', gap: 9 }}>
    {src ? (
      <Img src={staticFile(src)} style={{ height: 34 }} />
    ) : (
      <>
        {bag && <Img src={staticFile(bag)} style={{ height: 32 }} />}
        <span style={{ fontFamily: font, fontWeight: 700, fontSize: 23, letterSpacing: -0.2, color: color.text }}>Shopify</span>
      </>
    )}
  </div>
);

export const ChapterPill: React.FC<{ n: number; title: string }> = ({ n, title }) => (
  <div style={{ position: 'absolute', left: 48, top: 30, display: 'flex', alignItems: 'center', gap: 14, fontFamily: font }}>
    <div
      style={{
        width: 44, height: 44, borderRadius: 22, background: color.accentDim, color: color.text,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 600,
      }}
    >
      {String(n).padStart(2, '0')}
    </div>
    <div style={{ color: color.text, fontSize: 30, fontWeight: 500 }}>{title}</div>
  </div>
);

export const AppIcon: React.FC<{ src?: string; size: number }> = ({ src, size }) =>
  src ? (
    <Img src={staticFile(src)} style={{ width: size, height: size, borderRadius: size * 0.22 }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Hex size={size * 0.7} stroke="#f26b3a" />
    </div>
  );

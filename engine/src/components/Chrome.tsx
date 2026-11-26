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

/** PluginHive logo. brand/logos/pluginhive.png when present, else a text placeholder: all white on navy
 *  (review lesson #14), dark on the light hook background. */
export const PluginHiveLogo: React.FC<{ src?: string; dark?: boolean }> = ({ src, dark }) => (
  <div style={{ height: 34, display: 'flex', alignItems: 'center', gap: 6 }}>
    {src ? (
      <Img src={staticFile(src)} style={{ height: 34 }} />
    ) : (
      <>
        <Hex size={30} stroke={dark ? color.cardText : color.text} />
        <span style={{ fontFamily: font, fontWeight: 800, fontSize: 21, letterSpacing: 0.5, color: dark ? color.cardText : color.text }}>
          PLUGINHIVE
        </span>
      </>
    )}
  </div>
);

/** Shopify logo. brand/logos/shopify.png when present, else the bag icon + the name in white (lesson #11). */
export const ShopifyLogo: React.FC<{ src?: string; bag?: string }> = ({ src, bag }) => (
  <div style={{ height: 34, display: 'flex', alignItems: 'center', gap: 9 }}>
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

/** Top-right logo row: [carrier] [Shopify] [PluginHive]. PluginHive is on every scene; the others where
 *  the scene asks for them (build-props: title + closing cards by default). */
export const LogoRow: React.FC<{ pluginhive?: string; dark?: boolean; shopify?: { src?: string; bag?: string }; carrier?: string }> = ({ pluginhive, dark, shopify, carrier }) => (
  <div style={{ position: 'absolute', right: 48, top: 30, height: 34, display: 'flex', alignItems: 'center', gap: 30 }}>
    {carrier && <Img src={staticFile(carrier)} style={{ height: 34, maxWidth: 220, objectFit: 'contain' }} />}
    {shopify && <ShopifyLogo src={shopify.src} bag={shopify.bag} />}
    <PluginHiveLogo src={pluginhive} dark={dark} />
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

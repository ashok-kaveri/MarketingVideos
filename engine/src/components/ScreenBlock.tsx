import React from 'react';
import { Easing, Freeze, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { color, FPS, motion } from '../theme';
import type { Block, Media, Rect, TimedRect } from '../types';

interface Box { x: number; y: number; w: number; h: number }
interface Cam { s: number; tx: number; ty: number }
const IDENT: Cam = { s: 1, tx: 0, ty: 0 };
const ease = Easing.inOut(Easing.cubic);

/** contain-fit of the media inside the box (box-local coords) */
function fit(m: Media, box: Box) {
  const k = Math.min(box.w / m.w, box.h / m.h);
  return { k, ox: (box.w - m.w * k) / 2, oy: (box.h - m.h * k) / 2, dw: m.w * k, dh: m.h * k };
}

function toBox(r: Rect, f: ReturnType<typeof fit>): Rect {
  return [f.ox + r[0] * f.k, f.oy + r[1] * f.k, r[2] * f.k, r[3] * f.k];
}

function camFor(r: Rect, box: Box): Cam {
  const [x, y, w, h] = r;
  const s = Math.min(Math.max(Math.min((motion.zoomFill * box.w) / w, (motion.zoomFill * box.h) / h), motion.zoomMin), motion.zoomMax);
  let tx = box.w / 2 - (x + w / 2) * s;
  let ty = box.h / 2 - (y + h / 2) * s;
  tx = Math.min(0, Math.max(box.w - box.w * s, tx));
  ty = Math.min(0, Math.max(box.h - box.h * s, ty));
  return { s, tx, ty };
}

const lerp = (a: Cam, b: Cam, p: number): Cam => ({ s: a.s + (b.s - a.s) * p, tx: a.tx + (b.tx - a.tx) * p, ty: a.ty + (b.ty - a.ty) * p });

/** Zooms chain when next.from <= prev.to: camera pans directly target-to-target. */
export function cameraAt(frame: number, zooms: TimedRect[], f: ReturnType<typeof fit>, box: Box): Cam {
  const Z = motion.zoomFrames;
  for (let i = 0; i < zooms.length; i++) {
    const z = zooms[i];
    if (frame < z.from || frame >= z.to) continue;
    const target = camFor(toBox(z.rect, f), box);
    const prev = i > 0 && zooms[i - 1].to >= z.from ? camFor(toBox(zooms[i - 1].rect, f), box) : IDENT;
    const chainedNext = i < zooms.length - 1 && zooms[i + 1].from <= z.to;
    const pin = ease(Math.min(1, (frame - z.from) / Z));
    let cam = lerp(prev, target, pin);
    if (!chainedNext && frame >= z.to - Z) cam = lerp(target, IDENT, ease((frame - (z.to - Z)) / Z));
    return cam;
  }
  return IDENT;
}

const MediaLayer: React.FC<{ m: Media; style: React.CSSProperties }> = ({ m, style }) => {
  if (m.kind === 'image') return <Img src={staticFile(m.src)} style={style} />;
  const segs = m.segments ?? [];
  const last = segs[segs.length - 1];
  return (
    <>
      {segs.map((s, i) => (
        <Sequence key={i} from={s.outFrom} durationInFrames={s.outTo - s.outFrom} layout="none">
          <OffthreadVideo src={staticFile(m.src)} startFrom={Math.round(s.srcFrom * FPS)} endAt={Math.round(s.srcTo * FPS)} playbackRate={s.rate} muted style={style} />
        </Sequence>
      ))}
      {last && (
        <Sequence from={last.outTo} layout="none">
          <Sequence from={last.outFrom - last.outTo} layout="none">
            <Freeze frame={last.outTo - last.outFrom - 1}>
              <OffthreadVideo src={staticFile(m.src)} startFrom={Math.round(last.srcFrom * FPS)} endAt={Math.round(last.srcTo * FPS)} playbackRate={last.rate} muted style={style} />
            </Freeze>
          </Sequence>
        </Sequence>
      )}
    </>
  );
};

export const ScreenBlock: React.FC<{ block: Block; box: Box; radius?: number }> = ({ block, box, radius = 12 }) => {
  const frame = useCurrentFrame();
  const m = block.media;
  const f = fit(m, box);
  const cam = cameraAt(frame, block.zooms, f, box);
  const mediaStyle: React.CSSProperties = { position: 'absolute', left: f.ox, top: f.oy, width: f.dw, height: f.dh };
  const P = motion.blurPad;

  return (
    <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, overflow: 'hidden', borderRadius: radius }}>
      {/* letterbox fill so contain-fit gaps don't look broken */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.03)' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, width: box.w, height: box.h, transformOrigin: '0 0', transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.s})` }}>
        <div style={{ position: 'absolute', left: f.ox, top: f.oy, width: f.dw, height: f.dh, borderRadius: radius, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}>
          <MediaLayer m={m} style={{ ...mediaStyle, left: 0, top: 0 }} />
        </div>
        {block.blurs
          .filter((b) => frame >= b.from && frame < b.to)
          .map((b, i) => {
            const [x, y, w, h] = toBox(b.rect, f);
            return (
              <div key={i} style={{ position: 'absolute', left: x - P, top: y - P, width: w + 2 * P, height: h + 2 * P, overflow: 'hidden', borderRadius: 6 }}>
                <div style={{ position: 'absolute', left: -(x - P), top: -(y - P), width: box.w, height: box.h, filter: `blur(${motion.blurPx}px)` }}>
                  <MediaLayer m={m} style={mediaStyle} />
                </div>
              </div>
            );
          })}
      </div>
      {/* highlights drawn in screen space so stroke width stays constant while zoomed */}
      {block.highlights
        .filter((hl) => frame >= hl.from && frame < hl.to)
        .map((hl, i) => {
          const [x, y, w, h] = toBox(hl.rect, f);
          const pad = motion.highlightPad;
          const p = interpolate(frame - hl.from, [0, motion.highlightIn], [0, 1], { extrapolateRight: 'clamp' });
          const sx = cam.tx + (x - pad) * cam.s;
          const sy = cam.ty + (y - pad) * cam.s;
          return (
            <div
              key={i}
              style={{
                position: 'absolute', left: sx, top: sy, width: (w + 2 * pad) * cam.s, height: (h + 2 * pad) * cam.s,
                border: `${motion.highlightStroke}px solid ${color.accent}`, borderRadius: motion.highlightRadius,
                boxShadow: `0 0 12px rgba(0,211,232,0.35)`, opacity: p, transform: `scale(${1.04 - 0.04 * p})`,
              }}
            />
          );
        })}
    </div>
  );
};

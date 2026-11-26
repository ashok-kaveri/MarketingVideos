export type Rect = [number, number, number, number]; // x, y, w, h in source pixels

/** src in seconds, out in frames. freeze: hold the frame at srcFrom for the whole segment. */
export interface Segment { srcFrom: number; srcTo: number; rate: number; outFrom: number; outTo: number; freeze?: boolean }
export interface Media {
  src: string;            // path under public/
  kind: 'image' | 'video';
  w: number; h: number;
  segments?: Segment[];   // video only
  videoFrames?: number;   // total output frames of the video part
}
export interface TimedRect { rect: Rect; from: number; to: number } // frames, scene-relative
/** Opaque cover painted over the capture (e.g. replace a wrong app name). Rect in source pixels, frames scene-relative. */
export interface Patch extends TimedRect { bg: string; text?: string; color?: string; size?: number; weight?: number; icon?: string; padX?: number; align?: 'left' | 'center' }
export interface Block {
  media: Media;
  patches?: Patch[];
  caption?: string;
  zooms: TimedRect[];
  highlights: TimedRect[];
  blurs: TimedRect[];
}
export type SceneType =
  | 'hook' | 'title' | 'chapter' | 'screen' | 'split' | 'statement' | 'callout'
  | 'recap' | 'app_card' | 'support_card';

export interface Scene {
  id: string;
  type: SceneType;
  from: number;           // absolute frame
  duration: number;       // frames
  chapter?: number;
  shopifyLogo?: boolean;
  carrierLogo?: boolean;  // carrier.yaml `logo` in the top-right logo row
  fadeIn?: boolean;       // false = hard cut (screen -> screen: the frame stays, no dip to the background)
  audio?: string;         // path under public/
  audioFrom?: number;     // frame the narration starts at (the scene's lead-in)
  text?: string;
  kind?: string;
  block?: Block;
  left?: Block;
  right?: Block;
}
export interface Carrier {
  code: string; name: string; chapters: string[];
  hookBubbles: string[]; titleChips: string[]; recapLine: string;
  appCard: { price: string; rating: string; reviews: number; developer: string };
  supportUrl: string;
  logo?: string;          // carrier logo under public/ (carrier.yaml `logo`)
}
export interface Assets { pluginhiveLogo?: string; shopifyLogo?: string; shopifyBag?: string; appIcon?: string; music?: string }
export interface VideoProps { carrier: Carrier; scenes: Scene[]; totalFrames: number; assets: Assets; [k: string]: unknown }

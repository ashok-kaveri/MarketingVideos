export type Rect = [number, number, number, number]; // x, y, w, h in source pixels

export interface Segment { srcFrom: number; srcTo: number; rate: number; outFrom: number; outTo: number } // src in seconds, out in frames
export interface Media {
  src: string;            // path under public/
  kind: 'image' | 'video';
  w: number; h: number;
  segments?: Segment[];   // video only
  videoFrames?: number;   // total output frames of the video part
}
export interface TimedRect { rect: Rect; from: number; to: number } // frames, scene-relative
export interface Block {
  media: Media;
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
  audio?: string;         // path under public/
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
}
export interface Assets { pluginhiveLogo?: string; shopifyLogo?: string; appIcon?: string; music?: string }
export interface VideoProps { carrier: Carrier; scenes: Scene[]; totalFrames: number; assets: Assets; [k: string]: unknown }

import React from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { Background } from './components/Background';
import { ChapterPill, PluginHiveLogo, ShopifyLogo } from './components/Chrome';
import { ScreenBlock } from './components/ScreenBlock';
import { AppCard, CalloutCard, ChapterCard, Hook, Recap, Statement, SupportCard, Title } from './scenes/Cards';
import { color, font, FRAME, motion } from './theme';
import type { Block, Scene, VideoProps } from './types';

const FastForward: React.FC<{ block?: Block }> = ({ block }) => {
  const frame = useCurrentFrame();
  const seg = block?.media.segments?.find((s) => s.rate > 1.5 && frame >= s.outFrom && frame < s.outTo);
  if (!seg) return null;
  return (
    <div style={{ position: 'absolute', left: 48, bottom: 22, background: color.accentDim, color: '#fff', fontFamily: font, fontSize: 18, fontWeight: 600, borderRadius: 8, padding: '6px 12px' }}>
      ▶▶ {Math.round(seg.rate * 2) / 2}x fast-forward
    </div>
  );
};

const SPLIT = { w: 840, h: 660, gap: 40, top: 230 };

const SceneBody: React.FC<{ scene: Scene; props: VideoProps; prev?: Scene }> = ({ scene, props, prev }) => {
  const { carrier, assets } = props;
  switch (scene.type) {
    case 'hook': return <Hook carrier={carrier} />;
    case 'title': return <Title carrier={carrier} assets={assets} />;
    case 'chapter': return <ChapterCard n={scene.chapter!} total={carrier.chapters.length} title={carrier.chapters[scene.chapter! - 1]} />;
    case 'statement': return <Statement text={scene.text ?? ''} />;
    case 'recap': return <Recap carrier={carrier} />;
    case 'app_card': return <AppCard carrier={carrier} assets={assets} />;
    case 'support_card': return <SupportCard carrier={carrier} />;
    case 'screen': return <><ScreenBlock block={scene.block!} box={FRAME} /><FastForward block={scene.block} /></>;
    case 'callout':
      return (
        <>
          {scene.block && <div style={{ position: 'absolute', inset: 0, filter: 'brightness(0.55)' }}><ScreenBlock block={scene.block} box={FRAME} /></div>}
          <CalloutCard kind={scene.kind} />
        </>
      );
    case 'split': {
      const x0 = (1920 - (2 * SPLIT.w + SPLIT.gap)) / 2;
      return (
        <>
          {[scene.left!, scene.right!].map((b, i) => {
            const x = x0 + i * (SPLIT.w + SPLIT.gap);
            return (
              <React.Fragment key={i}>
                <div style={{ position: 'absolute', left: x, top: SPLIT.top - 62, width: SPLIT.w, textAlign: 'center', color: color.text, fontFamily: font, fontSize: 28, fontWeight: 500 }}>{b.caption}</div>
                <ScreenBlock block={b} box={{ x, y: SPLIT.top, w: SPLIT.w, h: SPLIT.h }} radius={10} />
              </React.Fragment>
            );
          })}
        </>
      );
    }
    default: return null;
  }
};

const SceneWrap: React.FC<{ scene: Scene; props: VideoProps }> = ({ scene, props }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, motion.sceneFade], [0, 1], { extrapolateRight: 'clamp' });
  const chapterTitle = scene.chapter && scene.type !== 'chapter' ? props.carrier.chapters[scene.chapter - 1] : undefined;
  return (
    <AbsoluteFill>
      <Background light={scene.type === 'hook'} />
      <AbsoluteFill style={{ opacity }}>
        <SceneBody scene={scene} props={props} />
      </AbsoluteFill>
      {chapterTitle && <ChapterPill n={scene.chapter!} title={chapterTitle} />}
      <PluginHiveLogo src={props.assets.pluginhiveLogo} dark={scene.type === 'hook'} />
      {scene.shopifyLogo && <ShopifyLogo src={props.assets.shopifyLogo} bag={props.assets.shopifyBag} />}
      {scene.audio && (
        <Sequence from={scene.audioFrom ?? 0} layout="none">
          <Audio src={staticFile(scene.audio)} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

export const CarrierVideo: React.FC<VideoProps> = (props) => (
  <AbsoluteFill style={{ background: color.bg }}>
    {props.scenes.map((s) => (
      <Sequence key={s.id} from={s.from} durationInFrames={s.duration} name={s.id}>
        <SceneWrap scene={s} props={props} />
      </Sequence>
    ))}
    {props.assets.music && <Audio src={staticFile(props.assets.music)} volume={0.08} loop />}
  </AbsoluteFill>
);

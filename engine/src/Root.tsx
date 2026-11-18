import React from 'react';
import { Composition } from 'remotion';
import { CarrierVideo } from './Video';
import { FPS, H, W } from './theme';
import { generated } from './generated';
import type { VideoProps } from './types';

export const RemotionRoot: React.FC = () => (
  <>
    {Object.entries(generated).map(([code, props]) => (
      <Composition
        key={code}
        id={`carrier-${code}`}
        component={CarrierVideo}
        durationInFrames={Math.max(1, (props as VideoProps).totalFrames)}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={props as VideoProps}
      />
    ))}
  </>
);

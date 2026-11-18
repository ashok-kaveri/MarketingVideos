import React from 'react';
import { AbsoluteFill } from 'remotion';
import { color } from '../theme';

export const Background: React.FC<{ light?: boolean }> = ({ light }) =>
  light ? (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 40%, #f4f8fc 0%, #dde8f3 100%)' }} />
  ) : (
    <AbsoluteFill
      style={{
        background: [
          'radial-gradient(circle at 8% 6%, rgba(0,154,180,0.22) 0%, rgba(0,154,180,0) 22%)',
          'radial-gradient(circle at 88% 78%, rgba(0,154,180,0.14) 0%, rgba(0,154,180,0) 26%)',
          `radial-gradient(ellipse at 50% 50%, ${color.bgCentre} 0%, ${color.bg} 55%, ${color.bgDeep} 100%)`,
        ].join(','),
      }}
    />
  );

import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface TrailerIconProps {
  size?: number;
  color?: string;
}

export function TrailerIcon({ size = 32, color = '#3b82f6' }: TrailerIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Trailer body outline with characteristic trailer shape */}
      <Path
        d="M4 10L6 8h13a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H6l-2-2V10z"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Hitch tongue */}
      <Path d="M2 14h2" stroke={color} strokeWidth="2" strokeLinecap="round" />

      {/* Left wheel */}
      <Circle cx="9" cy="17" r="2" fill="none" stroke={color} strokeWidth="2" />

      {/* Right wheel */}
      <Circle cx="15" cy="17" r="2" fill="none" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

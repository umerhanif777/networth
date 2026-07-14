import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { colors, radius } from '../theme';

// Networth mark: a hub-and-spoke network — you at the centre, your people
// radiating out. Simple, meaningful, reads at any size.
export function Logo({ size = 28 }: { size?: number }) {
  const inner = size * 0.62;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.sm,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={inner} height={inner} viewBox="0 0 24 24">
        <Line x1={12} y1={12} x2={12} y2={4.5} stroke="#fff" strokeWidth={1.6} />
        <Line x1={12} y1={12} x2={5} y2={18} stroke="#fff" strokeWidth={1.6} />
        <Line x1={12} y1={12} x2={19} y2={18} stroke="#fff" strokeWidth={1.6} />
        <Circle cx={12} cy={12} r={3} fill="#fff" />
        <Circle cx={12} cy={4.5} r={2.1} fill="#fff" />
        <Circle cx={5} cy={18} r={2.1} fill="#fff" />
        <Circle cx={19} cy={18} r={2.1} fill="#fff" />
      </Svg>
    </View>
  );
}

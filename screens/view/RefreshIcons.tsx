import React from 'react';
import { View } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
}

/**
 * Pure React Native vector Refresh icon rendered with native views/shapes.
 * Requires 0 additional npm packages and works across iOS, Android, and Web.
 */
export const RefreshIcon: React.FC<IconProps> = ({ size = 16, color = '#0969da' }) => {
  const borderWidth = Math.max(1.8, size * 0.14);
  const arrowSize = size * 0.32;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* 3/4 Circular ring */}
      <View
        style={{
          width: size * 0.78,
          height: size * 0.78,
          borderRadius: (size * 0.78) / 2,
          borderWidth,
          borderColor: color,
          borderTopColor: 'transparent',
          transform: [{ rotate: '-25deg' }],
        }}
      />
      {/* Arrowhead */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: size * 0.08,
          width: 0,
          height: 0,
          borderLeftWidth: arrowSize * 0.6,
          borderRightWidth: arrowSize * 0.6,
          borderBottomWidth: arrowSize,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
          transform: [{ rotate: '50deg' }],
        }}
      />
    </View>
  );
};

/**
 * Pure React Native vector Hourglass / Wait icon.
 */
export const WaitIcon: React.FC<IconProps> = ({ size = 16, color = '#0969da' }) => {
  const barHeight = Math.max(1.5, size * 0.1);
  const halfHeight = (size - barHeight * 2) / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Top bar */}
      <View
        style={{
          width: size * 0.8,
          height: barHeight,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
      {/* Top triangle */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.32,
          borderRightWidth: size * 0.32,
          borderTopWidth: halfHeight,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
        }}
      />
      {/* Bottom triangle */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.32,
          borderRightWidth: size * 0.32,
          borderBottomWidth: halfHeight,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
      {/* Bottom bar */}
      <View
        style={{
          width: size * 0.8,
          height: barHeight,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
    </View>
  );
};

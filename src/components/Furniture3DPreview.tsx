import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';

interface Furniture3DPreviewProps {
  color: string;
  emoji: string;
  size?: number;
}

// Isometric 3D cube rendered with plain RN Views + transforms.
// Three visible faces: top, left, right.
// Rotates continuously around Y axis via perspective transform.
export const Furniture3DPreview: React.FC<Furniture3DPreviewProps> = ({
  color,
  emoji,
  size = 80,
}) => {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [spin]);

  const rotateY = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const s = size;
  const faceSize = s * 0.55;
  const faceH = faceSize * 0.6;

  // Derive darker/lighter shades for the three faces
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };
  const shade = (hex: string, factor: number) => {
    try {
      const { r, g, b } = hexToRgb(hex.length === 7 ? hex : '#897FFF');
      const c = (v: number) => Math.min(255, Math.max(0, Math.round(v * factor)));
      return `rgb(${c(r)},${c(g)},${c(b)})`;
    } catch {
      return hex;
    }
  };

  const topColor   = shade(color, 1.15);
  const leftColor  = shade(color, 0.85);
  const rightColor = shade(color, 0.70);

  return (
    <View style={[localStyles.container, { width: s, height: s }]}>
      <Animated.View
        style={[
          localStyles.spinWrapper,
          {
            transform: [
              { perspective: 400 },
              { rotateY },
            ],
          },
        ]}
      >
        {/* Isometric cube: top face */}
        <View
          style={[
            localStyles.faceTop,
            {
              width: faceSize,
              height: faceH,
              backgroundColor: topColor,
              top: s * 0.12,
              left: (s - faceSize) / 2,
              transform: [{ rotateX: '45deg' }, { scaleY: 0.58 }],
            },
          ]}
        />
        {/* Left face */}
        <View
          style={[
            localStyles.faceSide,
            {
              width: faceSize / 2,
              height: faceH * 1.4,
              backgroundColor: leftColor,
              bottom: s * 0.08,
              left: (s - faceSize) / 2,
              transform: [{ skewY: '-30deg' }],
            },
          ]}
        />
        {/* Right face */}
        <View
          style={[
            localStyles.faceSide,
            {
              width: faceSize / 2,
              height: faceH * 1.4,
              backgroundColor: rightColor,
              bottom: s * 0.08,
              right: (s - faceSize) / 2,
              transform: [{ skewY: '30deg' }],
            },
          ]}
        />
        {/* Emoji on front face */}
        <View style={[localStyles.emojiLayer, { top: s * 0.3 }]}>
          <Text style={{ fontSize: s * 0.28, textAlign: 'center' }}>{emoji}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  spinWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  faceTop: {
    position: 'absolute',
    borderRadius: 4,
  },
  faceSide: {
    position: 'absolute',
    borderRadius: 2,
  },
  emojiLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});

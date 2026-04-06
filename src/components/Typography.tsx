import React from 'react';
import { Text as RNText, TextProps, StyleSheet, Platform } from 'react-native';

const FONT_MAP: Record<string, string> = {
  '100': 'SUIT-Regular',
  '200': 'SUIT-Regular',
  '300': 'SUIT-Regular',
  '400': 'SUIT-Regular',
  '500': 'SUIT-Medium',
  '600': 'SUIT-SemiBold',
  '700': 'SUIT-Bold',
  '800': 'SUIT-ExtraBold',
  '900': 'SUIT-ExtraBold',
  normal: 'SUIT-Regular',
  bold:   'SUIT-Bold',
};

export const Text = ({ style, ...props }: TextProps) => {
  const flat = StyleSheet.flatten(style) ?? {};
  const weight = String(flat.fontWeight ?? '400');
  const fontFamily = FONT_MAP[weight] ?? 'SUIT-Regular';
  return <RNText {...props} style={[{ fontFamily }, style]} />;
};

// 이모지 전용 — SUIT 폰트 차단, 시스템 폰트 강제 ('System' = RN iOS에서 UIFont.systemFont로 처리됨)
const EMOJI_FONT = Platform.select({ ios: 'System', android: 'sans-serif' }) as string;
export const EmojiText = ({ style, ...props }: TextProps) => (
  <RNText {...props} style={[{ fontFamily: EMOJI_FONT }, style, { fontFamily: EMOJI_FONT }]} />
);

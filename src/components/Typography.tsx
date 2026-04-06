import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';

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

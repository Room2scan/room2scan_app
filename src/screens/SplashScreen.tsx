/**
 * SplashScreen
 *
 * Shown once when the app first launches.
 * Displays start.png full-screen with a fade-out after ~1.8 s,
 * then calls onDone() to hand control to the main app.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Image, Dimensions } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const SPLASH_IMAGE = require('../../assets/start.png');

interface SplashScreenProps {
  onDone: () => void;
}

export const SplashScreen = ({ onDone }: SplashScreenProps) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Hold for 1.5 s then fade out over 0.5 s
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => onDone());
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Image
        source={SPLASH_IMAGE}
        style={styles.image}
        resizeMode="cover"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: '#FBFBFE',
  },
  image: {
    width: W,
    height: H,
  },
});

import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text } from '../components/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const logoY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    // 페이드인 + 로고 올라오는 애니메이션
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(logoY, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // 2초 후 페이드아웃 → onFinish
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => onFinish());
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.center, { opacity, transform: [{ translateY: logoY }] }]}>
        <Text style={styles.tagline}>시선을 · 공간으로</Text>
        <Image
          source={require('../../assets/images/splash-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6F6C8F',
    marginBottom: 12,
    letterSpacing: 0,
  },
  logo: {
    width: 140,
    height: 142,
  },
});

import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Text } from '../components/Typography';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const contentStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) });
    translateY.value = withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) });

    const dismiss = () => {
      opacity.value = withTiming(0, { duration: 400, easing: Easing.in(Easing.ease) }, (finished) => {
        if (finished) runOnJS(onFinish)();
      });
    };

    const t = setTimeout(dismiss, 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.center, containerStyle, contentStyle]}>
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
  container: { flex: 1, backgroundColor: '#FBFBFE', alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center' },
  tagline: { fontSize: 16, fontWeight: '400', color: '#6F6C8F', marginBottom: 12 },
  logo: { width: 140, height: 142 },
});

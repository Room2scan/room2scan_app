import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import * as Font from 'expo-font';

import { SnackbarProvider, useSnack } from './src/context/SnackbarContext';
import { SnackbarContainer } from './src/components/Shared';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SplashScreen } from './src/screens/SplashScreen';

const SnackbarOverlay = () => {
  const { snacks } = useSnack();
  return <SnackbarContainer snacks={snacks} onDismiss={() => {}} />;
};

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    Font.loadAsync({
      'SUIT-Regular':   require('./assets/fonts/SUITv1-Regular.ttf'),
      'SUIT-Medium':    require('./assets/fonts/SUITv1-Medium.ttf'),
      'SUIT-SemiBold':  require('./assets/fonts/SUITv1-SemiBold.ttf'),
      'SUIT-Bold':      require('./assets/fonts/SUITv1-Bold.ttf'),
      'SUIT-ExtraBold': require('./assets/fonts/SUITv1-ExtraBold.ttf'),
    }).then(() => setFontsLoaded(true)).catch(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) return null;

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SnackbarProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <SnackbarOverlay />
        </SnackbarProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

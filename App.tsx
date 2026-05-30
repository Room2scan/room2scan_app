import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HomeScreen } from './src/screens/HomeScreen';
import { MyRoomsScreen } from './src/screens/MyRoomsScreen';
import { CatalogFlowContainer } from './src/screens/CatalogScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { RoomDetailScreen } from './src/screens/RoomDetailScreen';
import { PanoramaCameraScreen } from './src/screens/PanoramaCameraScreen';
import { ReconstructionScreen } from './src/screens/ReconstructionScreen';
import { UnityEditorScreen } from './src/screens/UnityEditorScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { SnackbarContainer } from './src/components/Shared';

import { AppState, MainTab, SnackbarItem } from './src/types';

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [appState, setAppState] = useState<AppState>('home');
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('r1');
  const [cameraMode, setCameraMode] = useState<'room' | 'furniture'>('room');
  const [snacks, setSnacks] = useState<SnackbarItem[]>([]);

  const addSnack = useCallback((message: string, icon?: string) => {
    const id = `snack_${Date.now()}_${Math.random()}`;
    setSnacks(prev => [...prev.slice(-2), { id, message, icon }]);
    setTimeout(() => setSnacks(prev => prev.filter(s => s.id !== id)), 2800);
  }, []);

  const goHome    = () => { setAppState('home'); setActiveTab('home'); };
  const goCamera  = (mode: 'room' | 'furniture' = 'room') => { setCameraMode(mode); setAppState('camera'); };
  const goProcess = () => setAppState('processing');
  const goEditor  = () => setAppState('editor');
  const goRoomDetail = (id: string) => { setSelectedRoomId(id); setAppState('roomDetail'); };

  const handleTabChange = (tab: MainTab) => {
    setActiveTab(tab);
    if (appState !== 'home') setAppState('home');
  };

  const renderScreen = () => {
    if (appState === 'camera') {
      return (
        <PanoramaCameraScreen
          mode={cameraMode}
          onProcess={goProcess}
          onBack={() => {
            if (cameraMode === 'furniture') { setAppState('home'); setActiveTab('catalog'); }
            else goHome();
          }}
        />
      );
    }
    if (appState === 'processing') {
      return (
        <ReconstructionScreen
          onComplete={() => {
            if (cameraMode === 'furniture') { setAppState('home'); setActiveTab('catalog'); }
            else goEditor();
          }}
        />
      );
    }
    if (appState === 'editor') {
      return <UnityEditorScreen onBack={goHome} roomId={selectedRoomId} />;
    }
    if (appState === 'roomDetail') {
      return (
        <RoomDetailScreen
          roomId={selectedRoomId}
          onBack={() => { setAppState('home'); setActiveTab('rooms'); }}
          onOpenEditor={goEditor}
          onScanFurniture={() => goCamera('furniture')}
          onSnack={addSnack}
        />
      );
    }

    // Main tabs
    if (activeTab === 'home') {
      return (
        <HomeScreen
          onAddRoom={() => goCamera('room')}
          onOpenRoom={goRoomDetail}
          onTabChange={handleTabChange}
          onSnack={addSnack}
        />
      );
    }
    if (activeTab === 'rooms') {
      return (
        <MyRoomsScreen
          onOpenRoom={goRoomDetail}
          onAddRoom={() => goCamera('room')}
          onTabChange={handleTabChange}
        />
      );
    }
    if (activeTab === 'catalog') {
      return (
        <CatalogFlowContainer
          onAddMyFurniture={() => goCamera('furniture')}
          onTabChange={handleTabChange}
          onSnack={addSnack}
        />
      );
    }
    if (activeTab === 'settings') {
      return <SettingsScreen onTabChange={handleTabChange} />;
    }
    return null;
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={styles.root}>
        {renderScreen()}
        <SnackbarContainer snacks={snacks} onDismiss={id => setSnacks(prev => prev.filter(s => s.id !== id))} />
        {/* Version watermark */}
        <View style={styles.watermark} pointerEvents="none">
          <Text style={styles.watermarkText}>Scan2Room v1.0</Text>
        </View>
        {/* Splash – rendered on top; fades out automatically */}
        {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#FBFBFE', overflow: 'hidden' },
  watermark:     { position: 'absolute', bottom: 8, left: 0, right: 0, alignItems: 'center', zIndex: 1, opacity: 0.1 },
  watermarkText: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 4, fontWeight: '700', color: '#170F49' },
});

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import { HomeScreen } from './src/screens/HomeScreen';
import { MyRoomsScreen } from './src/screens/MyRoomsScreen';
import { CatalogFlowContainer } from './src/screens/CatalogScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { RoomDetailScreen } from './src/screens/RoomDetailScreen';
import { PanoramaCameraScreen } from './src/screens/PanoramaCameraScreen';
import { ReconstructionScreen } from './src/screens/ReconstructionScreen';
import { UnityEditorScreen } from './src/screens/UnityEditorScreen';
import { SnackbarContainer } from './src/components/Shared';

import { AppState, MainTab, SnackbarItem } from './src/types';

// ─── Editor Screen (3D placeholder) ──────────────────────────────────────────

const EditorScreen = ({ onBack }: { onBack: () => void }) => {
  const [showCatalog, setShowCatalog] = useState(false);
  const { ALL_FURNITURE } = require('./src/data');
  const { useSafeAreaInsets } = require('react-native-safe-area-context');
  const { BlurView } = require('expo-blur');
  const insets = useSafeAreaInsets();

  return (
    <View style={editorStyles.container}>
      {/* 3D Scene placeholder */}
      <LinearGradient colors={['#EAE8FF', '#F1F2F9']} style={StyleSheet.absoluteFillObject} />
      <View style={editorStyles.scene}>
        <View style={editorStyles.floor} />
        <View style={editorStyles.backWall} />
        <View style={editorStyles.leftWall} />
        {[
          { emoji: '🛋️', left: '20%', top: '55%', bg: 'rgba(255,255,255,0.9)' },
          { emoji: '🧸', left: '55%', top: '45%', bg: 'rgba(255,255,255,0.8)' },
        ].map((item, i) => (
          <View key={i} style={[editorStyles.sceneFurniture, { left: item.left as any, top: item.top as any, backgroundColor: item.bg }]}>
            <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
          </View>
        ))}
        <Text style={editorStyles.sceneHint}>드래그하여 회전</Text>
      </View>

      {/* Top bar */}
      <View style={[editorStyles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={onBack} style={editorStyles.iconBtn} activeOpacity={0.8}>
          <Feather name="chevron-left" size={20} color="#170F49" />
        </TouchableOpacity>
        <View style={editorStyles.projectInfo}>
          <View>
            <Text style={editorStyles.projectLabel}>Project</Text>
            <Text style={editorStyles.projectName}>My Bedroom v1</Text>
          </View>
          <View style={editorStyles.dividerV} />
          <TouchableOpacity>
            <Feather name="info" size={18} color="#4A3AFF" />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={editorStyles.iconBtn} activeOpacity={0.8}>
            <Feather name="rotate-ccw" size={18} color="#514F6E" />
          </TouchableOpacity>
          <TouchableOpacity style={editorStyles.iconBtn} activeOpacity={0.8}>
            <Feather name="rotate-cw" size={18} color="#514F6E" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Right toolbar */}
      <View style={editorStyles.rightToolbar}>
        {['maximize-2', 'layers', 'move', 'trash-2'].map((icon, i) => (
          <TouchableOpacity key={icon} style={[editorStyles.iconBtn, i === 2 && editorStyles.iconBtnActive]} activeOpacity={0.8}>
            <Feather name={icon as any} size={18} color={i === 2 ? '#fff' : '#514F6E'} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom controls */}
      <View style={[editorStyles.bottomControls, { paddingBottom: insets.bottom + 40 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View style={editorStyles.glassCard}>
            <TouchableOpacity onPress={() => setShowCatalog(true)} style={editorStyles.addBtn} activeOpacity={0.9}>
              <LinearGradient colors={['#4A3AFF', '#897FFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={editorStyles.addBtnInner}>
                <Feather name="plus" size={20} color="#fff" />
                <Text style={editorStyles.addBtnText}>가구 추가</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View style={editorStyles.glassCard}>
            <View style={editorStyles.viewModeToggle}>
              <View style={[editorStyles.viewModeItem, { opacity: 0.4 }]}>
                <Feather name="grid" size={20} color="#514F6E" />
                <Text style={editorStyles.viewModeText}>2D</Text>
              </View>
              <View style={editorStyles.viewModeItem}>
                <Feather name="box" size={20} color="#4A3AFF" />
                <Text style={[editorStyles.viewModeText, { color: '#4A3AFF' }]}>3D</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={onBack} style={editorStyles.doneBtn} activeOpacity={0.8}>
            <Feather name="check" size={28} color="#170F49" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const editorStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F2F9' },
  scene: { position: 'absolute', top: '15%', left: '5%', right: '5%', bottom: '20%', alignItems: 'center', justifyContent: 'center' },
  floor: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', backgroundColor: 'rgba(212,210,230,0.6)', borderRadius: 4 },
  backWall: { position: 'absolute', top: 0, left: 0, right: 0, height: '45%', backgroundColor: 'rgba(241,242,249,0.8)', borderRadius: 4 },
  leftWall: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '8%', backgroundColor: 'rgba(225,224,240,0.7)', borderRadius: 4 },
  sceneFurniture: { position: 'absolute', width: 60, height: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  sceneHint: { position: 'absolute', bottom: 16, color: 'rgba(81,79,110,0.6)', fontSize: 11, fontWeight: '500' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.80)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.50)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  iconBtnActive: { backgroundColor: '#4A3AFF', borderColor: '#4A3AFF', shadowColor: '#4A3AFF', shadowOpacity: 0.3 },
  projectInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.70)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.40)' },
  projectLabel: { fontSize: 10, color: '#A0A3BD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  projectName: { fontSize: 14, fontWeight: '700', color: '#170F49' },
  dividerV: { width: 1, height: 24, backgroundColor: 'rgba(200,200,220,0.6)' },
  rightToolbar: { position: 'absolute', right: 24, top: '30%', gap: 16, zIndex: 20 },
  bottomControls: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, zIndex: 20 },
  glassCard: { borderRadius: 20, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.70)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.40)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, padding: 8 },
  addBtn: { borderRadius: 18, overflow: 'hidden' },
  addBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 16 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  viewModeToggle: { flexDirection: 'row', gap: 16, paddingHorizontal: 8, paddingVertical: 8 },
  viewModeItem: { alignItems: 'center', gap: 4 },
  viewModeText: { fontSize: 10, color: '#514F6E' },
  doneBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.50)' },
});

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
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

  const goHome = () => { setAppState('home'); setActiveTab('home'); };
  const goCamera = (mode: 'room' | 'furniture' = 'room') => { setCameraMode(mode); setAppState('camera'); };
  const goProcess = () => setAppState('processing');
  const goEditor = () => setAppState('editor');
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
      return <UnityEditorScreen onBack={goHome} />;
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
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBFBFE', overflow: 'hidden' },
  watermark: { position: 'absolute', bottom: 8, left: 0, right: 0, alignItems: 'center', zIndex: 1, opacity: 0.1 },
  watermarkText: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 4, fontWeight: '700', color: '#170F49' },
});

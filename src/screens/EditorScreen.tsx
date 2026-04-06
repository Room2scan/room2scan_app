import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '../components/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { ALL_FURNITURE } from '../data';

export const EditorScreen = () => {
  const navigation = useNavigation<any>();
  const [showCatalog, setShowCatalog] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#EAE8FF', '#F1F2F9']} style={StyleSheet.absoluteFillObject} />
      <View style={styles.scene}>
        <View style={styles.floor} />
        <View style={styles.backWall} />
        <View style={styles.leftWall} />
        {[
          { icon: 'home', left: '20%', top: '55%', bg: 'rgba(255,255,255,0.9)' },
          { icon: 'grid', left: '55%', top: '45%', bg: 'rgba(255,255,255,0.8)' },
        ].map((item, i) => (
          <View key={i} style={[styles.sceneFurniture, { left: item.left as any, top: item.top as any, backgroundColor: item.bg }]}>
            <Feather name={item.icon as any} size={24} color="#4A3AFF" />
          </View>
        ))}
        <Text style={styles.sceneHint}>드래그하여 회전</Text>
      </View>

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} activeOpacity={0.8}>
          <Feather name="chevron-left" size={20} color="#170F49" />
        </TouchableOpacity>
        <View style={styles.projectInfo}>
          <View>
            <Text style={styles.projectLabel}>Project</Text>
            <Text style={styles.projectName}>My Bedroom v1</Text>
          </View>
          <View style={styles.dividerV} />
          <TouchableOpacity>
            <Feather name="info" size={18} color="#4A3AFF" />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
            <Feather name="rotate-ccw" size={18} color="#514F6E" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
            <Feather name="rotate-cw" size={18} color="#514F6E" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Right toolbar */}
      <View style={styles.rightToolbar}>
        {['maximize-2', 'layers', 'move', 'trash-2'].map((icon, i) => (
          <TouchableOpacity key={icon} style={[styles.iconBtn, i === 2 && styles.iconBtnActive]} activeOpacity={0.8}>
            <Feather name={icon as any} size={18} color={i === 2 ? '#fff' : '#514F6E'} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 40 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View style={styles.glassCard}>
            <TouchableOpacity onPress={() => setShowCatalog(true)} style={styles.addBtn} activeOpacity={0.9}>
              <LinearGradient colors={['#4A3AFF', '#897FFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.addBtnInner}>
                <Feather name="plus" size={20} color="#fff" />
                <Text style={styles.addBtnText}>가구 추가</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View style={styles.glassCard}>
            <View style={styles.viewModeToggle}>
              <View style={[styles.viewModeItem, { opacity: 0.4 }]}>
                <Feather name="grid" size={20} color="#514F6E" />
                <Text style={styles.viewModeText}>2D</Text>
              </View>
              <View style={styles.viewModeItem}>
                <Feather name="box" size={20} color="#4A3AFF" />
                <Text style={[styles.viewModeText, { color: '#4A3AFF' }]}>3D</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.doneBtn} activeOpacity={0.8}>
            <Feather name="check" size={28} color="#170F49" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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

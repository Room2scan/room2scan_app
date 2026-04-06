import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../components/Typography';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav } from '../components/Shared';
import { MainTab } from '../types';

interface SettingsScreenProps {
  onTabChange: (t: MainTab) => void;
}

export const SettingsScreen = ({ onTabChange }: SettingsScreenProps) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.headerSub}>Preferences</Text>
        <Text style={styles.headerTitle}>설정</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.placeholder}>
          <Feather name="settings" size={40} color="#A0A3BD" />
          <Text style={styles.placeholderText}>더 많은 설정 준비 중</Text>
        </View>
      </View>

      <BottomNav activeTab="settings" onTabChange={onTabChange} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFBFE' },
  header: { paddingBottom: 16, paddingHorizontal: 24 },
  headerSub: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 4, color: '#A0A3BD', marginBottom: 2 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#170F49' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholder: { alignItems: 'center', gap: 12, opacity: 0.3 },
  placeholderText: { fontSize: 14, color: '#A0A3BD' },
});

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Text } from './Typography';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTab, SnackbarItem } from '../types';

// ─── GlassCard ─────────────────────────────────────────────────────────────────

export const GlassCard = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) => (
  <View style={[styles.glassCardWrapper, style]}>
    <BlurView intensity={80} tint="light" style={styles.glassCardBlur}>
      {children}
    </BlurView>
  </View>
);

// ─── SnackbarContainer ──────────────────────────────────────────────────────────

export const SnackbarContainer = ({
  snacks,
  onDismiss,
}: {
  snacks: SnackbarItem[];
  onDismiss: (id: string) => void;
}) => {
  if (snacks.length === 0) return null;
  return (
    <View style={styles.snackbarContainer} pointerEvents="none">
      {snacks.map(snack => (
        <View key={snack.id} style={styles.snackbar}>
          <Feather name="check-circle" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.snackbarText}>{snack.message}</Text>
        </View>
      ))}
    </View>
  );
};

// ─── Bottom Navigation ──────────────────────────────────────────────────────────

type NavTab = {
  id: MainTab;
  featherIcon?: string;
  mciIcon?: string;
  label: string;
};

const NAV_TABS: NavTab[] = [
  { id: 'home', featherIcon: 'home', label: '홈' },
  { id: 'rooms', featherIcon: 'box', label: '내 방' },
  { id: 'catalog', mciIcon: 'sofa-outline', label: '카탈로그' },
  { id: 'settings', featherIcon: 'settings', label: '설정' },
];

export const BottomNav = ({
  activeTab,
  onTabChange,
}: {
  activeTab: MainTab;
  onTabChange: (t: MainTab) => void;
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.navOuter, { paddingBottom: Math.max(insets.bottom, 8) + 8 }]}
      pointerEvents="box-none"
    >
      {/* Glass pill — blur + dark overlay */}
      <View style={styles.navPill}>
        <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFillObject} />
        <View style={styles.navPillOverlay} />

        {NAV_TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const icon = tab.featherIcon
            ? <Feather name={tab.featherIcon as any} size={24} color="#fff" />
            : <MaterialCommunityIcons name={tab.mciIcon as any} size={24} color="#fff" />;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.75}
              style={styles.navTabBtn}
            >
              {isActive ? (
                <View style={styles.navActiveTab}>
                  {icon}
                  <Text style={styles.navActiveLabel}>{tab.label}</Text>
                </View>
              ) : (
                <View style={styles.navInactiveTab}>
                  {icon}
                  <Text style={styles.navInactiveLabel}>{tab.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  glassCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.40)',
  },
  glassCardBlur: {
    // content goes here
  },
  snackbarContainer: {
    position: 'absolute',
    bottom: 144,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
    zIndex: 100,
  },
  snackbar: {
    backgroundColor: '#170F49',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  snackbarIcon: {
    fontSize: 16,
  },
  snackbarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  navOuter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
    paddingHorizontal: 16,
  },
  navPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    borderRadius: 100,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 20,
    elevation: 12,
  },
  navPillOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,18,40,0.55)',
  },
  navTabBtn: {
    flex: 1,
    alignItems: 'center',
  },
  navActiveTab: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
  },
  navActiveLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  navInactiveTab: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 3,
  },
  navInactiveLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
    fontSize: 12,
  },
});

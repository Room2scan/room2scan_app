import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Text } from './Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
  { id: 'home',     featherIcon: 'home',     label: '홈' },
  { id: 'rooms',    featherIcon: 'box',      label: '내 방' },
  { id: 'catalog',  mciIcon: 'sofa-outline', label: '카탈로그' },
  { id: 'settings', featherIcon: 'settings', label: '설정' },
];

const LEFT_TABS  = NAV_TABS.slice(0, 2);
const RIGHT_TABS = NAV_TABS.slice(2);

const TabIcon = ({ tab, color, size }: { tab: NavTab; color: string; size: number }) =>
  tab.featherIcon
    ? <Feather name={tab.featherIcon as any} size={size} color={color} />
    : <MaterialCommunityIcons name={tab.mciIcon as any} size={size} color={color} />;

export const BottomNav = ({
  activeTab,
  onTabChange,
  onScan,
}: {
  activeTab: MainTab;
  onTabChange: (t: MainTab) => void;
  onScan?: () => void;
}) => {
  const insets = useSafeAreaInsets();

  const renderTab = (tab: NavTab) => {
    const isActive = activeTab === tab.id;
    return (
      <TouchableOpacity
        key={tab.id}
        onPress={() => onTabChange(tab.id)}
        activeOpacity={0.75}
        style={styles.tabTouch}
      >
        {isActive ? (
          <View style={styles.activeTab}>
            <TabIcon tab={tab} color="#170F49" size={20} />
            <Text style={styles.activeTabLabel}>{tab.label}</Text>
          </View>
        ) : (
          <View style={styles.inactiveTab}>
            <TabIcon tab={tab} color="rgba(255,255,255,0.55)" size={20} />
            <Text style={styles.inactiveTabLabel}>{tab.label}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 8) + 8 }]}
      pointerEvents="box-none"
    >
      {/* Shadow wrapper — no overflow:hidden so shadow is visible */}
      <View style={styles.pillShadow}>
        {/* Clip wrapper — overflow:hidden for BlurView */}
        <View style={styles.pill}>
          <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.pillOverlay} />

          {/* Content row */}
          <View style={styles.pillContent}>
            {LEFT_TABS.map(renderTab)}

            {/* Center scan button */}
            <TouchableOpacity
              onPress={onScan}
              activeOpacity={0.85}
              style={styles.scanTouch}
            >
              <LinearGradient
                colors={['#7B6FFF', '#4A3AFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.scanBtn}
              >
                <Feather name="camera" size={22} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            {RIGHT_TABS.map(renderTab)}
          </View>
        </View>
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
  glassCardBlur: {},
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
  snackbarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Nav layout ──
  outer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  pillShadow: {
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.40,
    shadowRadius: 28,
    elevation: 16,
  },
  pill: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  pillOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,6,22,0.68)',
    borderRadius: 999,
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },

  // ── Tab items ──
  tabTouch: {
    borderRadius: 999,
  },
  activeTab: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 4,
  },
  activeTabLabel: {
    color: '#170F49',
    fontSize: 10,
    fontWeight: '700',
  },
  inactiveTab: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  inactiveTabLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '500',
  },

  // ── Center scan button ──
  scanTouch: {
    borderRadius: 999,
    marginHorizontal: 6,
  },
  scanBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

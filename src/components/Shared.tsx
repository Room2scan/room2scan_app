import React, { useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Text, EmojiText } from './Typography';
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
          {snack.icon && <EmojiText style={styles.snackbarIcon}>{snack.icon}</EmojiText>}
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
  const bottomPad = Math.max(insets.bottom, 8) + 8;

  return (
    <View
      style={[styles.bottomNavOuter, { paddingBottom: bottomPad }]}
      pointerEvents="box-none"
    >
      <LinearGradient
        colors={['rgba(251,251,254,0)', 'rgba(251,251,254,0.98)']}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={styles.bottomNavWrapper} pointerEvents="box-none">
        <View style={styles.bottomNavInner}>
          {NAV_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const iconColor = isActive ? '#fff' : '#A0A3BD';
            const iconSize = isActive ? 17 : 20;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => onTabChange(tab.id)}
                activeOpacity={0.8}
                style={styles.navTabBtn}
              >
                {isActive ? (
                  <LinearGradient
                    colors={['#4A3AFF', '#7B6FFF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.navActivePill}
                  >
                    {tab.featherIcon ? (
                      <Feather name={tab.featherIcon as any} size={iconSize} color={iconColor} />
                    ) : (
                      <MaterialCommunityIcons name={tab.mciIcon as any} size={iconSize} color={iconColor} />
                    )}
                    <Text style={styles.navActiveLabel}>{tab.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.navInactiveItem}>
                    {tab.featherIcon ? (
                      <Feather name={tab.featherIcon as any} size={iconSize} color={iconColor} />
                    ) : (
                      <MaterialCommunityIcons name={tab.mciIcon as any} size={iconSize} color={iconColor} />
                    )}
                    <Text style={styles.navInactiveLabel}>{tab.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
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
  bottomNavOuter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 12,
    zIndex: 20,
  },
  bottomNavWrapper: {
    alignItems: 'center',
  },
  bottomNavInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.70)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    shadowColor: '#4A3AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 6,
  },
  navTabBtn: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navActivePill: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#4A3AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 8,
    elevation: 4,
  },
  navActiveLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 10,
  },
  navInactiveItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 52,
  },
  navInactiveLabel: {
    color: '#A0A3BD',
    fontWeight: '500',
    fontSize: 10,
  },
});

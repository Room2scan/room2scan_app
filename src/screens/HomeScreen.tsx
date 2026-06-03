import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav } from '../components/Shared';
import { HERO_BANNERS, MY_ROOMS, POPULAR_FURNITURE } from '../data';
import { MainTab, RoomProject } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HomeScreenProps {
  rooms?: RoomProject[];
  onAddRoom:  () => void;
  onScanRoom?: () => void;
  onOpenRoom: (roomId: string) => void;
  onTabChange: (t: MainTab) => void;
  onSnack: (msg: string, icon?: string) => void;
  onOpenCatalogTrend?: () => void;
}

export const HomeScreen = ({
  rooms = MY_ROOMS,
  onAddRoom,
  onScanRoom,
  onOpenRoom,
  onTabChange,
  onSnack,
  onOpenCatalogTrend,
}: HomeScreenProps) => {
  const insets = useSafeAreaInsets();
  const [activeBanner, setActiveBanner] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const bannerSwipeX = useRef(new Animated.Value(0)).current;

  const BANNER_HEIGHT = Math.round(SCREEN_HEIGHT * 0.52);
  const SHEET_OVERLAP = 28;
  const MIN_BANNER = 72;
  const MAX_SCROLL = BANNER_HEIGHT - MIN_BANNER - SHEET_OVERLAP;

  useEffect(() => {
    const t = setInterval(() => setActiveBanner(prev => (prev + 1) % HERO_BANNERS.length), 5500);
    return () => clearInterval(t);
  }, []);

  const bannerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => bannerSwipeX.setValue(0),
      onPanResponderMove: (_, g) => bannerSwipeX.setValue(g.dx),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -40) {
          setActiveBanner(prev => (prev + 1) % HERO_BANNERS.length);
        } else if (g.dx > 40) {
          setActiveBanner(prev => (prev - 1 + HERO_BANNERS.length) % HERO_BANNERS.length);
        }
        Animated.spring(bannerSwipeX, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const bannerHeight = scrollY.interpolate({ inputRange: [0, MAX_SCROLL], outputRange: [BANNER_HEIGHT, MIN_BANNER + SHEET_OVERLAP], extrapolate: 'clamp' });
  const bannerOpacity = scrollY.interpolate({ inputRange: [0, MAX_SCROLL * 0.625], outputRange: [1, 0], extrapolate: 'clamp' });
  const bannerScale = scrollY.interpolate({ inputRange: [0, MAX_SCROLL], outputRange: [1, 0.97], extrapolate: 'clamp' });
  const sheetBorderRadius = scrollY.interpolate({ inputRange: [0, MAX_SCROLL], outputRange: [28, 0], extrapolate: 'clamp' });
  const headerBgOpacity = scrollY.interpolate({ inputRange: [MAX_SCROLL * 0.6, MAX_SCROLL], outputRange: [0, 1], extrapolate: 'clamp' });
  const titleOpacity = scrollY.interpolate({ inputRange: [MAX_SCROLL * 0.5, MAX_SCROLL], outputRange: [0, 1], extrapolate: 'clamp' });

  const activeBannerData = HERO_BANNERS[activeBanner];

  return (
    <View style={styles.container}>
      {/* Fixed top bar — always white */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8, backgroundColor: '#fff' }]}>
        <Image
          source={require('../../assets/Room2scan.png')}
          style={styles.wordmarkTopBar}
          resizeMode="contain"
        />
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
            <Feather name="bell" size={16} color="#514F6E" />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Image
              source={require('../../assets/profile.png')}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </View>
        </View>
      </View>

      {/* Hero banner */}
      <Animated.View
        style={[styles.heroBanner, { height: bannerHeight, transform: [{ scale: bannerScale }, { translateX: bannerSwipeX }] }]}
        {...bannerPanResponder.panHandlers}
      >
        {HERO_BANNERS.map((banner, idx) => (
          <Animated.View
            key={banner.id}
            style={[styles.bannerSlide, { opacity: idx === activeBanner ? 1 : 0 }]}
          >
            <Image source={typeof banner.imageUrl === 'string' ? { uri: banner.imageUrl } : banner.imageUrl} style={styles.bannerImage} resizeMode="cover" />
            <LinearGradient
              colors={[banner.overlayFrom, banner.overlayTo, 'rgba(0,0,0,0.55)']}
              locations={[0, 0.6, 1]}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        ))}

        {/* Banner content */}
        <Animated.View style={[styles.bannerContent, { opacity: bannerOpacity }]}>
          <View style={styles.bannerTag}>
            <View style={styles.bannerDot} />
            <Text style={styles.bannerTagText}>{activeBannerData.label}</Text>
          </View>
          <Text style={styles.bannerHeadline}>{activeBannerData.headline}</Text>
          <Text style={styles.bannerSubtext}>{activeBannerData.subtext}</Text>
        </Animated.View>

        {/* Dots */}
        <Animated.View style={[styles.bannerDots, { opacity: bannerOpacity }]}>
          {HERO_BANNERS.map((b, i) => (
            <TouchableOpacity
              key={b.id}
              onPress={() => setActiveBanner(i)}
              style={[styles.dot, i === activeBanner ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </Animated.View>
      </Animated.View>

      {/* Scrollable sheet */}
      <Animated.ScrollView
        style={StyleSheet.absoluteFillObject}
        contentContainerStyle={{ paddingTop: BANNER_HEIGHT - SHEET_OVERLAP }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.sheet, { borderTopLeftRadius: sheetBorderRadius, borderTopRightRadius: sheetBorderRadius }]}>
          {/* Search */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Feather name="search" size={15} color="#A0A3BD" />
              <TextInput
                placeholder="가구 또는 방 검색..."
                placeholderTextColor="#A0A3BD"
                style={styles.searchInput}
              />
            </View>
          </View>

          {/* My Rooms */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>내 방 목록</Text>
              <TouchableOpacity onPress={() => onTabChange('rooms')} style={styles.seeAll}>
                <Text style={styles.seeAllText}>전체 보기</Text>
                <Feather name="chevron-right" size={13} color="#4A3AFF" />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={styles.hScrollContent}>

              {rooms.map(room => (
                <TouchableOpacity key={room.id} onPress={() => onOpenRoom(room.id)} activeOpacity={0.85} style={styles.roomCard}>
                  <View style={styles.roomCardImage}>
                    <Image source={typeof room.heroImage === 'string' ? { uri: room.heroImage } : room.heroImage} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={StyleSheet.absoluteFillObject} />
                    {room.isFeatured && (
                      <View style={styles.featuredBadge}>
                        <Feather name="star" size={7} color="#fff" />
                        <Text style={styles.featuredText}>대표</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.roomCardBody}>
                    <Text style={styles.roomCardName}>{room.name}</Text>
                    <Text style={styles.roomCardMeta}>{room.area} · {room.furnitureCount}개</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Trending furniture */}
          <View style={[styles.section, { marginBottom: 28 }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.trendingTitle}>
                <Feather name="trending-up" size={15} color="#4A3AFF" />
                <Text style={styles.sectionTitle}>지금 트렌드</Text>
              </View>
              <TouchableOpacity onPress={() => onOpenCatalogTrend ? onOpenCatalogTrend() : onTabChange('catalog')} style={styles.seeAll}>
                <Text style={styles.seeAllText}>전체 보기</Text>
                <Feather name="chevron-right" size={13} color="#4A3AFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.furnitureGrid}>
              {POPULAR_FURNITURE.map(item => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => onSnack(`${item.name} 상세 보기`, item.thumbnail)}
                  activeOpacity={0.85}
                  style={styles.furnitureCard}
                >
                  <View style={[styles.furnitureThumbnail, { backgroundColor: `${item.color}20` }]}>
                    {item.imageUrl ? (
                      <Image
                        source={typeof item.imageUrl === 'string' ? { uri: item.imageUrl } : item.imageUrl}
                        style={{ width: '100%', height: '100%', borderRadius: 14 }}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.furnitureEmoji}>{item.thumbnail}</Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.furnitureName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.furnitureMeta}>{item.type} · {item.dimensions}</Text>
                  </View>
                  <View style={styles.furnitureFooter}>
                    <Text style={styles.furniturePrice}>{item.price}</Text>
                    <View style={styles.ratingRow}>
                      <Feather name="star" size={10} color="#FBBF24" />
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      </Animated.ScrollView>

      <BottomNav activeTab="home" onTabChange={onTabChange} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFBFE' },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
    paddingBottom: 12, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  feedTitle: { fontSize: 18, fontWeight: '700', color: '#170F49' },
  // Room2scan wordmark – top bar (coloured background, fades in on scroll)
  wordmarkTopBar: {
    width: 130,
    height: 18,
  },
  // Room2scan wordmark – banner overlay (white pill on dark image)
  wordmarkPill: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  wordmarkImg: {
    width: 116,
    height: 15,
  },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bellBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#F1F2F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#E9EAF0',
    borderWidth: 2, borderColor: '#4A3AFF',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  heroBanner: {
    position: 'absolute', top: 0, left: 0, right: 0,
    overflow: 'hidden', transformOrigin: 'top center',
  },
  bannerSlide: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  bannerImage: { width: '100%', height: '100%' },
  brandLabel: { position: 'absolute', left: 20, zIndex: 10 },
  bannerContent: { position: 'absolute', bottom: 56, left: 0, right: 0, paddingHorizontal: 20 },
  bannerTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.20)', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)',
  },
  bannerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  bannerTagText: { color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  bannerHeadline: { color: '#fff', fontSize: 24, fontWeight: '700', lineHeight: 30, marginBottom: 6 },
  bannerSubtext: { color: 'rgba(255,255,255,0.80)', fontSize: 12, lineHeight: 18, maxWidth: 280 },
  bannerDots: { position: 'absolute', bottom: 52, right: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { borderRadius: 999, height: 6 },
  dotActive: { width: 20, backgroundColor: '#fff' },
  dotInactive: { width: 6, backgroundColor: 'rgba(255,255,255,0.40)' },
  sheet: {
    minHeight: '100%', paddingBottom: 144, backgroundColor: '#FBFBFE',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  searchRow: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#EAE8FF', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#170F49', padding: 0 },
  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#170F49' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 12, fontWeight: '600', color: '#4A3AFF' },
  trendingTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hScroll: { marginLeft: -20 },
  hScrollContent: { paddingLeft: 20, paddingRight: 20, gap: 12 },
  addRoomCard: {
    width: 144, borderRadius: 20, borderWidth: 2, borderColor: '#D9DBE9', borderStyle: 'dashed',
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, flexShrink: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  addRoomIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#EAE8FF', alignItems: 'center', justifyContent: 'center' },
  addRoomTitle: { fontSize: 12, fontWeight: '700', color: '#170F49' },
  addRoomSub: { fontSize: 10, color: '#A0A3BD', marginTop: 2 },
  roomCard: { width: 144, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.60)', flexShrink: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  roomCardImage: { width: '100%', aspectRatio: 1, backgroundColor: '#F1F2F9', position: 'relative', overflow: 'hidden' },
  featuredBadge: { position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#4A3AFF', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  featuredText: { color: '#fff', fontSize: 8, fontWeight: '700' },
  roomCardBody: { padding: 10, backgroundColor: '#fff' },
  roomCardName: { fontSize: 12, fontWeight: '700', color: '#170F49', lineHeight: 16 },
  roomCardMeta: { fontSize: 10, color: '#514F6E', marginTop: 2 },
  furnitureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  furnitureCard: {
    width: '47.5%', borderRadius: 20, padding: 16, gap: 12,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F2F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  furnitureThumbnail: { width: '100%', aspectRatio: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  furnitureEmoji: { fontSize: 32 },
  furnitureName: { fontSize: 14, fontWeight: '700', color: '#170F49' },
  furnitureMeta: { fontSize: 11, color: '#514F6E', marginTop: 2 },
  furnitureFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' },
  furniturePrice: { fontSize: 12, fontWeight: '700', color: '#4A3AFF' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 10, color: '#A0A3BD' },
});

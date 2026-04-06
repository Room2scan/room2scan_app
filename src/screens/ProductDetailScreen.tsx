import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Text } from '../components/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FurnitureItem } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TYPE_COLORS: Record<string, string> = {
  Sofa: '#897FFF', Chair: '#4A3AFF', Bed: '#6B5EFF',
  Table: '#5448E0', Shelf: '#7B6FFF', Dresser: '#8E84FF',
};
const COLOR_OPTIONS = ['#F5F5F5', '#C4B9A0', '#4A3AFF', '#2D2D2D', '#D4C5B0'];
const REVIEW_DATA = [
  { id: 'rv1', author: '이재현', rating: 5, text: '배송 빠르고 조립도 쉬워요. 방에 딱 맞는 사이즈!' },
  { id: 'rv2', author: '김민지', rating: 4, text: '색감이 사진보다 더 예쁘네요. 추천합니다.' },
  { id: 'rv3', author: '박준서', rating: 5, text: '퀄리티 대비 가격이 합리적이에요.' },
];
const RECOMMENDED_ITEMS = [
  { id: 'rec1', name: 'LACK Table', thumb: '🧸', price: '₩15,000', color: '#4A3AFF' },
  { id: 'rec2', name: 'KALLAX Shelf', thumb: '📚', price: '₩129,000', color: '#EAE8FF' },
  { id: 'rec3', name: 'POÄNG Chair', thumb: '🪑', price: '₩179,000', color: '#897FFF' },
];
const DETAIL_TABS = [{ id: 'specs' as const, label: '스펙' }, { id: 'materials' as const, label: '소재' }, { id: 'reviews' as const, label: '리뷰' }];
const RATING_BARS = [{ stars: 5, width: 0.72 }, { stars: 4, width: 0.20 }, { stars: 3, width: 0.08 }];

const getSpecsForItem = (item: FurnitureItem) => [
  { label: '크기', value: item.dimensions },
  { label: '유형', value: item.type },
  { label: '소재', value: item.type === 'Bed' ? '참나무 합판' : item.type === 'Sofa' ? '패브릭/스폰지' : '원목/MDF' },
  { label: '최대 하중', value: item.type === 'Shelf' ? '25 kg/선반' : item.type === 'Bed' ? '200 kg' : '150 kg' },
  { label: '조립 방식', value: '직접 조립 (공구 포함)' },
  { label: '보증 기간', value: '5년' },
];

const getMaterialsForItem = (item: FurnitureItem): string[] => {
  const base = ['친환경 인증 목재', '수성 도료'];
  if (item.type === 'Sofa') return ['고탄력 폼 쿠션', '패브릭 커버 (세탁 가능)', '단단한 나무 프레임'];
  if (item.type === 'Chair') return [...base, '통기성 패브릭', '인체공학 등받이'];
  if (item.type === 'Bed') return [...base, '슬랫 베이스', '철재 강화 프레임'];
  return base;
};

const RatingStars = ({ rating }: { rating: number }) => {
  const full = Math.floor(rating);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[0,1,2,3,4].map(i => (
        <Feather key={i} name="star" size={13} color={i < full ? '#FBBF24' : '#D9DBE9'} />
      ))}
    </View>
  );
};

interface ProductDetailScreenProps {
  item: FurnitureItem;
  isWishlisted: boolean;
  onBack: () => void;
  onToggleWishlist: (id: string) => void;
  onAddToRoom: (item: FurnitureItem) => void;
  onSnack: (msg: string, icon?: string) => void;
}

export const ProductDetailScreen = ({
  item,
  isWishlisted,
  onBack,
  onToggleWishlist,
  onAddToRoom,
  onSnack,
}: ProductDetailScreenProps) => {
  const insets = useSafeAreaInsets();
  const [selectedColor, setSelectedColor] = useState(item.color);
  const [activeTab, setActiveTab] = useState<'specs' | 'materials' | 'reviews'>('specs');
  const [addedToRoom, setAddedToRoom] = useState(false);
  const [view3DActive, setView3DActive] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  const PREVIEW_HEIGHT = 320;
  const accentColor = TYPE_COLORS[item.type] ?? '#4A3AFF';
  const specs = getSpecsForItem(item);
  const materials = getMaterialsForItem(item);

  const headerSolidOpacity = scrollY.interpolate({
    inputRange: [PREVIEW_HEIGHT * 0.55 - 20, PREVIEW_HEIGHT * 0.55 + 20],
    outputRange: [0, 1], extrapolate: 'clamp',
  });
  const heroOpacity = scrollY.interpolate({
    inputRange: [0, PREVIEW_HEIGHT * 0.7],
    outputRange: [1, 0], extrapolate: 'clamp',
  });
  const titleInHeaderOpacity = scrollY.interpolate({
    inputRange: [PREVIEW_HEIGHT * 0.55 - 10, PREVIEW_HEIGHT * 0.55 + 20],
    outputRange: [0, 1], extrapolate: 'clamp',
  });

  const handleAddToRoom = () => {
    setAddedToRoom(true);
    onAddToRoom(item);
    onSnack(`${item.name} 방에 추가됨`, item.thumbnail);
    setTimeout(() => setAddedToRoom(false), 2200);
  };

  return (
    <View style={styles.container}>
      {/* Floating header */}
      <Animated.View style={[styles.floatingHeader, { paddingTop: insets.top + 12 }]}>
        <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(251,251,254,0.96)' }, { opacity: headerSolidOpacity }]} />
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
          <Feather name="chevron-left" size={20} color="#170F49" />
        </TouchableOpacity>
        <Animated.View style={[styles.headerTitleWrap, { opacity: titleInHeaderOpacity }]}>
          <Text style={styles.headerTitleText} numberOfLines={1}>{item.name}</Text>
        </Animated.View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => onSnack('링크가 복사되었어요', '🔗')} style={styles.headerBtn} activeOpacity={0.8}>
            <Feather name="share-2" size={15} color="#170F49" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onToggleWishlist(item.id)} style={styles.headerBtn} activeOpacity={0.8}>
            <Feather name="heart" size={15} color={isWishlisted ? '#EF4444' : '#170F49'} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Body */}
      <Animated.ScrollView
        style={StyleSheet.absoluteFillObject}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview area */}
        <View style={[styles.preview, { height: PREVIEW_HEIGHT }]}>
          <LinearGradient
            colors={[`${accentColor}18`, `${accentColor}08`, '#EAE8FF']}
            style={StyleSheet.absoluteFillObject}
          />
          {/* View toggle */}
          <Animated.View style={[styles.viewToggle, { opacity: heroOpacity }]}>
            {[{ label: '3D', is3D: true }, { label: '2D', is3D: false }].map(v => (
              <TouchableOpacity
                key={v.label}
                onPress={() => setView3DActive(v.is3D)}
                style={[styles.viewToggleBtn, { backgroundColor: view3DActive === v.is3D ? accentColor : 'transparent' }]}
              >
                <Feather name={v.is3D ? 'box' : 'maximize-2'} size={11} color={view3DActive === v.is3D ? '#fff' : '#A0A3BD'} />
                <Text style={[styles.viewToggleBtnText, { color: view3DActive === v.is3D ? '#fff' : '#A0A3BD' }]}>{v.label}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Furniture preview */}
          <View style={styles.previewContent}>
            <View style={[styles.furnitureDisplay, { backgroundColor: `${selectedColor}25`, borderColor: `${accentColor}20` }]}>
              <Text style={styles.furnitureEmoji}>{item.thumbnail}</Text>
            </View>
            {view3DActive && (
              <Animated.View style={[styles.rotateHint, { opacity: heroOpacity }]}>
                <Feather name="rotate-cw" size={10} color="rgba(255,255,255,0.8)" />
                <Text style={styles.rotateHintText}>드래그하여 회전</Text>
              </Animated.View>
            )}
          </View>

          {/* Bottom fade */}
          <LinearGradient
            colors={['transparent', '#FBFBFE']}
            style={styles.previewFade}
            pointerEvents="none"
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Product header */}
          <View style={styles.productHeader}>
            <View style={styles.productHeaderRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.typeBadgeRow}>
                  <View style={[styles.typeBadge, { backgroundColor: `${accentColor}18` }]}>
                    <Text style={[styles.typeBadgeText, { color: accentColor }]}>{item.type}</Text>
                  </View>
                  {item.isMyFurniture && (
                    <View style={styles.myFurnitureBadge}>
                      <Text style={styles.myFurnitureBadgeText}>내 가구</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.productName}>{item.name}</Text>
              </View>
              <Text style={[styles.productPrice, { color: accentColor }]}>{item.price}</Text>
            </View>
            <View style={styles.ratingRow}>
              <RatingStars rating={item.rating} />
              <Text style={styles.ratingNum}>{item.rating.toFixed(1)}</Text>
              <Text style={styles.ratingDot}>·</Text>
              <Text style={styles.ratingCount}>리뷰 {Math.floor(item.rating * 12)}개</Text>
            </View>
          </View>

          {/* Dimensions */}
          <View style={[styles.dimensionsRow, { backgroundColor: `${accentColor}10` }]}>
            <View style={[styles.dimensionsIcon, { backgroundColor: accentColor }]}>
              <Feather name="maximize-2" size={15} color="#fff" />
            </View>
            <View>
              <Text style={styles.dimensionsLabel}>제품 크기</Text>
              <Text style={styles.dimensionsValue}>{item.dimensions}</Text>
            </View>
          </View>

          {/* Color selection */}
          {!item.isMyFurniture && (
            <View style={styles.colorSection}>
              <View style={styles.colorHeader}>
                <Text style={styles.colorTitle}>컬러 선택</Text>
                <Text style={styles.colorCount}>5가지 색상</Text>
              </View>
              <View style={styles.colorSwatches}>
                {COLOR_OPTIONS.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setSelectedColor(c)}
                    style={[styles.swatch, { backgroundColor: c, borderColor: selectedColor === c ? '#4A3AFF' : 'rgba(0,0,0,0.08)', borderWidth: selectedColor === c ? 2.5 : 2 }]}
                  />
                ))}
              </View>
            </View>
          )}

          <View style={styles.divider} />

          {/* Detail tabs */}
          <View style={styles.tabsContainer}>
            <View style={styles.tabsRow}>
              {DETAIL_TABS.map(tab => (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={[styles.tabBtn, { backgroundColor: activeTab === tab.id ? '#fff' : 'transparent', shadowColor: activeTab === tab.id ? '#000' : 'transparent', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: activeTab === tab.id ? 2 : 0 }]}
                >
                  <Text style={[styles.tabBtnText, { color: activeTab === tab.id ? '#170F49' : '#A0A3BD' }]}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {activeTab === 'specs' && (
              <View>
                {specs.map(spec => (
                  <View key={spec.label} style={styles.specRow}>
                    <Text style={styles.specLabel}>{spec.label}</Text>
                    <Text style={styles.specValue}>{spec.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'materials' && (
              <View style={{ gap: 10 }}>
                {materials.map((mat, i) => (
                  <View key={i} style={styles.materialRow}>
                    <View style={[styles.materialIcon, { backgroundColor: `${accentColor}15` }]}>
                      <Feather name="package" size={13} color={accentColor} />
                    </View>
                    <Text style={styles.materialText}>{mat}</Text>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'reviews' && (
              <View style={{ gap: 12 }}>
                {/* Aggregate */}
                <View style={[styles.reviewAggregate, { backgroundColor: `${accentColor}08`, borderColor: `${accentColor}15` }]}>
                  <View style={styles.reviewScore}>
                    <Text style={[styles.reviewBigScore, { color: accentColor }]}>{item.rating.toFixed(1)}</Text>
                    <RatingStars rating={item.rating} />
                  </View>
                  <View style={styles.reviewBars}>
                    {RATING_BARS.map(bar => (
                      <View key={bar.stars} style={styles.reviewBar}>
                        <Text style={styles.reviewBarNum}>{bar.stars}</Text>
                        <View style={styles.reviewBarTrack}>
                          <View style={[styles.reviewBarFill, { width: `${bar.width * 100}%` as any, backgroundColor: accentColor }]} />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
                {REVIEW_DATA.map(rv => (
                  <View key={rv.id} style={styles.reviewCard}>
                    <View style={styles.reviewCardHeader}>
                      <View style={styles.reviewCardLeft}>
                        <LinearGradient colors={[accentColor, '#897FFF']} style={styles.reviewAvatar}>
                          <Text style={styles.reviewAvatarText}>{rv.author[0]}</Text>
                        </LinearGradient>
                        <Text style={styles.reviewAuthor}>{rv.author}</Text>
                      </View>
                      <RatingStars rating={rv.rating} />
                    </View>
                    <Text style={styles.reviewText}>{rv.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Related products */}
          <View style={styles.divider} />
          <View style={styles.relatedSection}>
            <View style={styles.relatedHeader}>
              <Text style={styles.relatedTitle}>어울리는 제품</Text>
              <TouchableOpacity style={styles.seeAll}>
                <Text style={[styles.seeAllText, { color: accentColor }]}>전체 보기</Text>
                <Feather name="chevron-right" size={12} color={accentColor} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: -20 }} contentContainerStyle={{ paddingLeft: 20, paddingRight: 20, gap: 12 }}>
              {RECOMMENDED_ITEMS.map(rec => (
                <View key={rec.id} style={styles.recCard}>
                  <View style={[styles.recImage, { backgroundColor: `${rec.color}20` }]}>
                    <Text style={styles.recEmoji}>{rec.thumb}</Text>
                  </View>
                  <Text style={styles.recName} numberOfLines={1}>{rec.name}</Text>
                  <Text style={[styles.recPrice, { color: accentColor }]}>{rec.price}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Sticky CTA */}
      <LinearGradient
        colors={['rgba(251,251,254,0)', 'rgba(251,251,254,1)']}
        style={[styles.ctaContainer, { paddingBottom: insets.bottom + 20 }]}
        pointerEvents="box-none"
      >
        <View style={styles.ctaRow} pointerEvents="box-none">
          <TouchableOpacity onPress={() => onToggleWishlist(item.id)} style={styles.wishlistLargeBtn} activeOpacity={0.85}>
            <Feather name="heart" size={20} color={isWishlisted ? '#EF4444' : '#A0A3BD'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAddToRoom} activeOpacity={0.9} style={styles.addToRoomBtnWrap}>
            <LinearGradient
              colors={addedToRoom ? ['#22c55e', '#16a34a'] : [accentColor, '#897FFF']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.addToRoomBtn}
            >
              <Feather name={addedToRoom ? 'check-circle' : 'shopping-cart'} size={18} color="#fff" />
              <Text style={styles.addToRoomBtnText}>{addedToRoom ? '방에 추가됨!' : '방에 배치하기'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFBFE' },
  floatingHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.90)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.60)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  headerTitleWrap: { flex: 1, marginHorizontal: 12 },
  headerTitleText: { fontSize: 14, fontWeight: '700', color: '#170F49', textAlign: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.90)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.60)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  preview: { width: '100%', flexShrink: 0, position: 'relative', overflow: 'hidden' },
  viewToggle: {
    position: 'absolute', top: 64, right: 16, zIndex: 20,
    flexDirection: 'row', alignItems: 'center', padding: 4, borderRadius: 10, gap: 2,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)',
  },
  viewToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  viewToggleBtnText: { fontSize: 10, fontWeight: '700' },
  previewContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  furnitureDisplay: {
    width: 176, height: 176, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 6,
  },
  furnitureEmoji: { fontSize: 80 },
  rotateHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.4)', marginTop: 16,
  },
  rotateHintText: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '500' },
  previewFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 64 },
  content: { backgroundColor: '#FBFBFE', paddingHorizontal: 20, paddingBottom: 176 },
  productHeader: { paddingTop: 8, paddingBottom: 20 },
  productHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  typeBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  typeBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  myFurnitureBadge: { backgroundColor: '#4A3AFF', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  myFurnitureBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  productName: { fontSize: 22, fontWeight: '700', color: '#170F49', lineHeight: 28 },
  productPrice: { fontSize: 20, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingNum: { fontSize: 12, fontWeight: '700', color: '#170F49' },
  ratingDot: { color: '#D9DBE9' },
  ratingCount: { fontSize: 11, color: '#A0A3BD' },
  dimensionsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, marginBottom: 20,
  },
  dimensionsIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dimensionsLabel: { fontSize: 11, color: '#A0A3BD', fontWeight: '500' },
  dimensionsValue: { fontSize: 13, fontWeight: '700', color: '#170F49' },
  colorSection: { marginBottom: 20 },
  colorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  colorTitle: { fontSize: 13, fontWeight: '700', color: '#170F49' },
  colorCount: { fontSize: 11, color: '#A0A3BD' },
  colorSwatches: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  swatch: { width: 28, height: 28, borderRadius: 14 },
  divider: { height: 1, backgroundColor: '#F1F2F9', marginVertical: 20 },
  tabsContainer: { marginBottom: 20 },
  tabsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16,
    padding: 4, borderRadius: 14, backgroundColor: '#F1F2F9',
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  tabBtnText: { fontSize: 12, fontWeight: '700' },
  specRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F2F9' },
  specLabel: { fontSize: 12, color: '#A0A3BD', fontWeight: '500' },
  specValue: { fontSize: 12, fontWeight: '600', color: '#170F49' },
  materialRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F2F9' },
  materialIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  materialText: { fontSize: 12, fontWeight: '600', color: '#514F6E' },
  reviewAggregate: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingVertical: 16, borderRadius: 18, marginBottom: 8, borderWidth: 1 },
  reviewScore: { alignItems: 'center' },
  reviewBigScore: { fontSize: 36, fontWeight: '700' },
  reviewBars: { flex: 1, gap: 4 },
  reviewBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewBarNum: { fontSize: 10, color: '#A0A3BD', width: 12 },
  reviewBarTrack: { flex: 1, height: 6, backgroundColor: '#EAE8FF', borderRadius: 3, overflow: 'hidden' },
  reviewBarFill: { height: '100%', borderRadius: 3 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#F1F2F9' },
  reviewCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  reviewCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  reviewAuthor: { fontSize: 12, fontWeight: '700', color: '#170F49' },
  reviewText: { fontSize: 12, color: '#514F6E', lineHeight: 18 },
  relatedSection: { marginBottom: 20 },
  relatedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  relatedTitle: { fontSize: 13, fontWeight: '700', color: '#170F49' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 11, fontWeight: '600' },
  recCard: { width: 112, borderRadius: 16, padding: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F2F9', flexShrink: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  recImage: { width: '100%', aspectRatio: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  recEmoji: { fontSize: 24 },
  recName: { fontSize: 10, fontWeight: '700', color: '#170F49' },
  recPrice: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  ctaContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
    paddingHorizontal: 20, paddingTop: 20,
  },
  ctaRow: { flexDirection: 'row', gap: 12 },
  wishlistLargeBtn: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE8FF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  addToRoomBtnWrap: { flex: 1 },
  addToRoomBtn: { height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  addToRoomBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav } from '../components/Shared';
import { ProductDetailScreen } from './ProductDetailScreen';

// 카테고리 대표 사진: 크롭된 그리드 이미지 또는 Unsplash fallback
const FURNITURE_PHOTOS: Record<string, any> = {
  Sofa:        require('../../assets/catalog/sofa/0.png'),
  Chair:       require('../../assets/catalog/chair/0.png'),
  Table:       require('../../assets/catalog/table/0.png'),
  Shelf:       require('../../assets/catalog/shelf/0.png'),
  Kitchen:     require('../../assets/catalog/kitchen/0.png'),
  Decor:       require('../../assets/catalog/decor/0.png'),
  Electronics: 'https://images.unsplash.com/photo-1593359677879-a4bb92f4280e?w=400&h=400&fit=crop&auto=format',
  Other:       require('../../assets/catalog/sofa/0.png'),
};

const imgSrc = (src: any) => (typeof src === 'string' ? { uri: src } : src);
import { ALL_FURNITURE, CATEGORY_TABS } from '../data';
import { MainTab, FurnitureItem, CatalogCategory } from '../types';

interface CatalogFlowContainerProps {
  onAddMyFurniture: () => void;
  onTabChange: (t: MainTab) => void;
  onSnack: (msg: string, icon?: string) => void;
}

export const CatalogFlowContainer = ({
  onAddMyFurniture,
  onTabChange,
  onSnack,
}: CatalogFlowContainerProps) => {
  const [flow, setFlow] = useState<'list' | 'detail'>('list');
  const [selectedItem, setSelectedItem] = useState<FurnitureItem | null>(null);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(
    new Set(ALL_FURNITURE.filter(f => f.isWishlisted).map(f => f.id))
  );

  const handleOpenProduct = (item: FurnitureItem) => {
    setSelectedItem(item);
    setFlow('detail');
  };

  const handleBackToList = () => {
    setFlow('list');
    setSelectedItem(null);
  };

  const handleToggleWishlist = (id: string) => {
    setWishlistIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        onSnack('찜 목록에서 제거했어요', '🗑️');
      } else {
        next.add(id);
        onSnack('찜 목록에 추가했어요!', '❤️');
      }
      return next;
    });
  };

  const handleAddToRoom = (item: FurnitureItem) => {
    onSnack(`${item.name} 방에 추가됨`, item.thumbnail);
  };

  if (flow === 'detail' && selectedItem) {
    return (
      <ProductDetailScreen
        item={selectedItem}
        isWishlisted={wishlistIds.has(selectedItem.id)}
        onBack={handleBackToList}
        onToggleWishlist={handleToggleWishlist}
        onAddToRoom={handleAddToRoom}
        onSnack={onSnack}
      />
    );
  }

  return (
    <CatalogList
      wishlistIds={wishlistIds}
      onAddMyFurniture={onAddMyFurniture}
      onTabChange={onTabChange}
      onSnack={onSnack}
      onOpenProduct={handleOpenProduct}
      onToggleWishlist={handleToggleWishlist}
    />
  );
};

interface CatalogListProps {
  wishlistIds: Set<string>;
  onAddMyFurniture: () => void;
  onTabChange: (t: MainTab) => void;
  onSnack: (msg: string, icon?: string) => void;
  onOpenProduct: (item: FurnitureItem) => void;
  onToggleWishlist: (id: string) => void;
}

const CatalogList = ({
  wishlistIds,
  onAddMyFurniture,
  onTabChange,
  onSnack,
  onOpenProduct,
  onToggleWishlist,
}: CatalogListProps) => {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<CatalogCategory>('wishlist');

  // Trend tab: curated picks — one from each non-kitchen category
  const TREND_IDS = [
    'frl_apartment_sofa', 'frl_apartment_chair_01', 'frl_apartment_table_01',
    'frl_apartment_cabinet', 'frl_apartment_lamp_01', 'frl_apartment_indoor_plant_01',
    'frl_apartment_vase_01', 'frl_apartment_rug_01', 'frl_apartment_beanbag',
    'frl_apartment_table_04', 'frl_apartment_rack_01', 'frl_apartment_cushion_01',
  ];

  const filteredItems: FurnitureItem[] = (() => {
    if (activeCategory === 'trend') return ALL_FURNITURE.filter(f => TREND_IDS.includes(f.id));
    if (activeCategory === 'wishlist') return ALL_FURNITURE.filter(f => wishlistIds.has(f.id));
    if (activeCategory === 'myFurniture') return ALL_FURNITURE.filter(f => f.isMyFurniture);
    // 'bed' slot is repurposed as '주방 / Kitchen' since ReplicaCAD has no bed objects.
    const typeMap: Record<string, string> = { sofa: 'Sofa', bed: 'Kitchen', table: 'Table', shelf: 'Shelf', chair: 'Chair' };
    return ALL_FURNITURE.filter(f => !f.isMyFurniture && f.type === typeMap[activeCategory]);
  })();

  const isMyFurnitureTab = activeCategory === 'myFurniture';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSub}>Browse</Text>
            <Text style={styles.headerTitle}>카탈로그</Text>
          </View>
          {isMyFurnitureTab && (
            <TouchableOpacity onPress={onAddMyFurniture} activeOpacity={0.85} style={styles.scanBtn}>
              <Feather name="camera" size={16} color="#fff" />
              <Text style={styles.scanBtnText}>가구 스캔</Text>
            </TouchableOpacity>
          )}
        </View>
        {/* Category tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
          {CATEGORY_TABS.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              activeOpacity={0.85}
              style={[styles.tab, activeCategory === cat.id ? styles.tabActive : styles.tabInactive]}
            >
              <Text style={styles.tabIcon}>{cat.icon}</Text>
              <Text style={[styles.tabLabel, activeCategory === cat.id ? styles.tabLabelActive : styles.tabLabelInactive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Trend header */}
        {activeCategory === 'trend' && (
          <View style={styles.trendHeader}>
            <Feather name="trending-up" size={15} color="#4A3AFF" />
            <Text style={styles.trendHeaderText}>지금 트렌드</Text>
          </View>
        )}

        {/* Empty wishlist */}
        {activeCategory === 'wishlist' && filteredItems.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="heart" size={24} color="#4A3AFF" />
            </View>
            <Text style={styles.emptyTitle}>찜한 가구가 없어요</Text>
            <Text style={styles.emptyDesc}>하트를 눌러 마음에 드는 가구를 저장하세요</Text>
          </View>
        )}

        {/* My furniture scan CTA */}
        {isMyFurnitureTab && (
          <TouchableOpacity onPress={onAddMyFurniture} activeOpacity={0.9} style={styles.myScanCard}>
            <View style={styles.myScanIcon}>
              <Feather name="camera" size={20} color="#4A3AFF" />
            </View>
            <Text style={styles.myScanTitle}>내 가구 추가</Text>
            <Text style={styles.myScanDesc}>카메라로 가구를 촬영해 3D로 변환하세요</Text>
          </TouchableOpacity>
        )}

        {/* Items grid */}
        {filteredItems.length > 0 && (
          <View style={styles.grid}>
            {filteredItems.map(item => (
              <TouchableOpacity
                key={item.id}
                onPress={() => onOpenProduct(item)}
                activeOpacity={0.85}
                style={styles.card}
              >
                <View style={styles.cardImageWrap}>
                  <View style={styles.cardImage}>
                    {item.isMyFurniture ? (
                      <Text style={styles.cardEmoji}>{item.thumbnail}</Text>
                    ) : (
                      <Image
                        source={imgSrc(item.imageUrl ?? FURNITURE_PHOTOS[item.type] ?? FURNITURE_PHOTOS.Decor)}
                        style={styles.cardPhoto}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                  {!item.isMyFurniture && (
                    <TouchableOpacity
                      onPress={(e) => { onToggleWishlist(item.id); }}
                      style={styles.wishlistBtn}
                    >
                      <Feather
                        name="heart"
                        size={14}
                        color={wishlistIds.has(item.id) ? '#F87171' : '#A0A3BD'}
                      />
                    </TouchableOpacity>
                  )}
                  {item.isMyFurniture && (
                    <View style={styles.myFurnitureBadge}>
                      <Text style={styles.myFurnitureBadgeText}>내 가구</Text>
                    </View>
                  )}
                </View>
                <View>
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cardMeta}>{item.type}</Text>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardPrice}>{item.price}</Text>
                  <View style={styles.ratingRow}>
                    <Feather name="star" size={10} color="#FBBF24" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <BottomNav activeTab="catalog" onTabChange={onTabChange} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFBFE' },
  trendHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  trendHeaderText: { fontSize: 15, fontWeight: '700', color: '#170F49' },
  header: { paddingBottom: 16, paddingHorizontal: 24, flexShrink: 0 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerSub: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 4, color: '#A0A3BD', marginBottom: 2 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#170F49' },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#4A3AFF', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10,
    shadowColor: '#897FFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  scanBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  tabs: { marginLeft: -24 },
  tabsContent: { paddingLeft: 24, paddingRight: 24, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, flexShrink: 0 },
  tabActive: { backgroundColor: '#4A3AFF', shadowColor: '#897FFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  tabInactive: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE8FF' },
  tabIcon: { fontSize: 13 },
  tabLabel: { fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: '#fff' },
  tabLabelInactive: { color: '#514F6E' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 144 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#EAE8FF', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#170F49' },
  emptyDesc: { fontSize: 11, color: '#A0A3BD', textAlign: 'center' },
  myScanCard: {
    width: '100%', marginBottom: 16, borderWidth: 2, borderColor: '#D9DBE9', borderStyle: 'dashed',
    backgroundColor: '#fff', borderRadius: 20, paddingVertical: 20, alignItems: 'center', gap: 8,
  },
  myScanIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#EAE8FF', alignItems: 'center', justifyContent: 'center' },
  myScanTitle: { fontSize: 14, fontWeight: '700', color: '#170F49' },
  myScanDesc: { fontSize: 11, color: '#A0A3BD' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47.5%', borderRadius: 20, padding: 16, gap: 12,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F2F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  cardImageWrap: { position: 'relative' },
  cardImage: { width: '100%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F2F9' },
  cardPhoto: { width: '100%', height: '100%' },
  cardEmoji: { fontSize: 36 },
  wishlistBtn: {
    position: 'absolute', top: 8, right: 8, width: 28, height: 28,
    borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  myFurnitureBadge: {
    position: 'absolute', top: 8, left: 8, backgroundColor: '#4A3AFF',
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
  },
  myFurnitureBadgeText: { color: '#fff', fontSize: 8, fontWeight: '700' },
  cardName: { fontSize: 14, fontWeight: '700', color: '#170F49' },
  cardMeta: { fontSize: 11, color: '#514F6E', marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardPrice: { fontSize: 12, fontWeight: '700', color: '#4A3AFF' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 10, color: '#A0A3BD' },
});

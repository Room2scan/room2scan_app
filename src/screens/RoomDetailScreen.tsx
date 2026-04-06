import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { Text } from '../components/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MY_ROOMS, ALL_FURNITURE } from '../data';
import { RoomFurnitureItem, FurnitureItem, ViewMode } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RoomDetailScreenProps {
  roomId: string;
  onBack: () => void;
  onOpenEditor: () => void;
  onScanFurniture: () => void;
  onSnack: (msg: string, icon?: string) => void;
}

export const RoomDetailScreen = ({
  roomId,
  onBack,
  onOpenEditor,
  onScanFurniture,
  onSnack,
}: RoomDetailScreenProps) => {
  const insets = useSafeAreaInsets();
  const room = MY_ROOMS.find(r => r.id === roomId) ?? MY_ROOMS[0];
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const [roomFurniture, setRoomFurniture] = useState<RoomFurnitureItem[]>(room.furniture);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const HERO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.48);
  const selectedItem = roomFurniture.find(f => f.id === selectedFurnitureId);

  useEffect(() => {
    setRoomFurniture(room.furniture);
    setSelectedFurnitureId(null);
    setViewMode('2d');
  }, [roomId]);

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT * 0.6], outputRange: [1, 0], extrapolate: 'clamp',
  });
  const headerBgOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT * 0.5 - 20, HERO_HEIGHT * 0.5 + 20], outputRange: [0, 1], extrapolate: 'clamp',
  });
  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT * 0.5, HERO_HEIGHT * 0.5 + 30], outputRange: [0, 1], extrapolate: 'clamp',
  });

  const handleFurnitureTap = (id: string) => {
    if (!showActionMenu) setSelectedFurnitureId(prev => prev === id ? null : id);
  };

  const handleDelete = () => {
    const name = selectedItem?.name ?? '가구';
    setRoomFurniture(prev => prev.filter(f => f.id !== selectedFurnitureId));
    setSelectedFurnitureId(null);
    setShowActionMenu(false);
    onSnack(`${name} 삭제됨`, '🗑️');
  };

  const handleDuplicate = () => {
    if (!selectedItem) return;
    const newItem: RoomFurnitureItem = {
      ...selectedItem,
      id: `${selectedItem.id}_copy_${Date.now()}`,
      x: Math.min(selectedItem.x + 5, 80),
      y: Math.min(selectedItem.y + 5, 80),
    };
    setRoomFurniture(prev => [...prev, newItem]);
    setSelectedFurnitureId(null);
    setShowActionMenu(false);
    onSnack(`${selectedItem.name} 복제됨`, '✨');
  };

  const handleRotate = () => {
    if (!selectedFurnitureId) return;
    setRoomFurniture(prev =>
      prev.map(f => f.id === selectedFurnitureId ? { ...f, rotation: (f.rotation + 45) % 360 } : f)
    );
    onSnack('가구 회전됨', '🔄');
  };

  const addFurnitureToRoom = (item: FurnitureItem) => {
    const newItem: RoomFurnitureItem = {
      id: `rf_${item.id}_${Date.now()}`,
      name: item.name,
      thumbnail: item.thumbnail,
      dimensions: item.dimensions,
      x: 40 + Math.random() * 20,
      y: 40 + Math.random() * 20,
      rotation: 0,
    };
    setRoomFurniture(prev => [...prev, newItem]);
    setShowAddSheet(false);
    onSnack(`${item.name} 추가됨`, item.thumbnail);
  };

  const actionMenuItems = [
    { icon: 'move', label: '이동', action: () => setShowActionMenu(false), color: '#4A3AFF' },
    { icon: 'rotate-cw', label: '회전', action: () => { handleRotate(); setShowActionMenu(false); }, color: '#4A3AFF' },
    { icon: 'copy', label: '복제', action: handleDuplicate, color: '#514F6E' },
    { icon: 'trash-2', label: '삭제', action: handleDelete, color: '#EF4444' },
  ];

  return (
    <View style={styles.container}>
      {/* Floating top bar */}
      <Animated.View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(251,251,254,0.95)' }, { opacity: headerBgOpacity }]} />
        <TouchableOpacity onPress={onBack} style={styles.iconBtn} activeOpacity={0.8}>
          <Feather name="chevron-left" size={20} color="#170F49" />
        </TouchableOpacity>
        <Animated.Text style={[styles.topBarTitle, { opacity: headerTitleOpacity }]}>{room.name}</Animated.Text>
        <View style={styles.topBarRight}>
          <TouchableOpacity onPress={() => onSnack('링크가 복사되었어요', '🔗')} style={styles.iconBtn} activeOpacity={0.8}>
            <Feather name="share-2" size={16} color="#170F49" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsWishlisted(w => !w)} style={styles.iconBtn} activeOpacity={0.8}>
            <Feather name="heart" size={16} color={isWishlisted ? '#EF4444' : '#170F49'} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Scrollable content */}
      <Animated.ScrollView
        style={StyleSheet.absoluteFillObject}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={{ height: HERO_HEIGHT }}>
          {viewMode === '2d' ? (
            <Image source={{ uri: room.heroImage }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, styles.mock3D]}>
              <View style={styles.mock3DGrid}>
                {roomFurniture.slice(0, 3).map(item => (
                  <View key={item.id} style={styles.mock3DItem}>
                    <Text style={styles.mock3DEmoji}>{item.thumbnail}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.mock3DLabel}>3D 뷰</Text>
            </View>
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.15)', 'transparent', 'rgba(251,251,254,1)']}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Photo counter */}
          {viewMode === '2d' && (
            <View style={styles.photoCounter}>
              <Text style={styles.photoCounterText}>1 / {1 + room.realPhotos.length}</Text>
            </View>
          )}

          {/* View mode toggle */}
          <Animated.View style={[styles.viewToggle, { opacity: heroOpacity }]}>
            <View style={styles.viewToggleInner}>
              {(['2d', '3d'] as ViewMode[]).map(mode => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setViewMode(mode)}
                  style={[styles.viewToggleBtn, { backgroundColor: viewMode === mode ? 'rgba(255,255,255,0.9)' : 'transparent' }]}
                >
                  <Text style={[styles.viewToggleBtnText, { color: viewMode === mode ? '#170F49' : 'rgba(255,255,255,0.6)' }]}>
                    {mode.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* Info sheet */}
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          {/* Room name & meta */}
          <View style={styles.sheetPadded}>
            <Text style={styles.roomName}>{room.name}</Text>
            <View style={styles.metaRow}>
              <Feather name="map-pin" size={12} color="#A0A3BD" />
              <Text style={styles.metaText}>{room.area}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Feather name="box" size={12} color="#A0A3BD" />
              <Text style={styles.metaText}>가구 {roomFurniture.length}개</Text>
              <Text style={styles.metaDot}>·</Text>
              <Feather name="clock" size={12} color="#A0A3BD" />
              <Text style={styles.metaText}>{room.lastEdited} 수정</Text>
            </View>
            <Text style={styles.roomDesc}>{room.description}</Text>
          </View>

          <View style={styles.divider} />

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{room.area}</Text>
              <Text style={styles.statLabel}>총 면적</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="box" size={16} color="#4A3AFF" />
                <Text style={styles.statValue}>3D</Text>
              </View>
              <Text style={styles.statLabel}>재구성 완료</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{roomFurniture.length}</Text>
              <Text style={styles.statLabel}>배치된 가구</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* 3D badge */}
          <View style={[styles.sheetPadded, { marginBottom: 20 }]}>
            <View style={styles.badgeRow}>
              <LinearGradient colors={['#4A3AFF', '#897FFF']} style={styles.badgeIcon}>
                <Feather name="box" size={16} color="#fff" />
              </LinearGradient>
              <View>
                <Text style={styles.badgeTitle}>3D 재구성 완료</Text>
                <Text style={styles.badgeSub}>AI가 실제 공간을 3D로 변환했어요</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* 2D floor plan */}
          {viewMode === '2d' && (
            <View style={[styles.sheetPadded, { marginBottom: 20 }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>평면도 뷰</Text>
                <Text style={styles.sectionHint}>탭하여 가구 선택</Text>
              </View>
              <View style={styles.floorPlan}>
                {/* Grid background */}
                <View style={StyleSheet.absoluteFillObject}>
                  <View style={styles.gridBg} />
                </View>
                <View style={styles.floorPlanBorder} />
                {roomFurniture.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleFurnitureTap(item.id)}
                    onLongPress={() => { setSelectedFurnitureId(item.id); setShowActionMenu(true); }}
                    style={[
                      styles.furnitureDot,
                      {
                        left: `${item.x}%` as any,
                        top: `${item.y}%` as any,
                        transform: [{ rotate: `${item.rotation}deg` }],
                        borderColor: selectedFurnitureId === item.id ? '#4A3AFF' : '#D9DBE9',
                        backgroundColor: selectedFurnitureId === item.id ? '#EAE8FF' : '#fff',
                        borderWidth: selectedFurnitureId === item.id ? 2 : 1,
                      },
                    ]}
                  >
                    <Text style={styles.furnitureDotEmoji}>{item.thumbnail}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.divider} />

          {/* Furniture list */}
          <View style={[styles.sheetPadded, { marginBottom: 20 }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>배치된 가구</Text>
              <TouchableOpacity onPress={() => setShowAddSheet(true)} style={styles.addBtn}>
                <Feather name="plus" size={14} color="#4A3AFF" />
                <Text style={styles.addBtnText}>추가</Text>
              </TouchableOpacity>
            </View>
            <View style={{ gap: 10 }}>
              {roomFurniture.map(item => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleFurnitureTap(item.id)}
                  activeOpacity={0.85}
                  style={[
                    styles.furnitureRow,
                    selectedFurnitureId === item.id
                      ? styles.furnitureRowSelected
                      : styles.furnitureRowDefault,
                  ]}
                >
                  <View style={styles.furnitureIcon}>
                    <Text style={styles.furnitureEmoji}>{item.thumbnail}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.furnitureName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.furnitureDim}>{item.dimensions}</Text>
                  </View>
                  {selectedFurnitureId === item.id && (
                    <View style={styles.furnitureActions}>
                      <TouchableOpacity onPress={handleRotate} style={styles.furnitureActionBtn}>
                        <Feather name="rotate-cw" size={14} color="#4A3AFF" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleDuplicate} style={styles.furnitureActionBtn}>
                        <Feather name="copy" size={14} color="#514F6E" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleDelete} style={[styles.furnitureActionBtn, styles.deleteBtn]}>
                        <Feather name="trash-2" size={14} color="#F87171" />
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Sticky CTA */}
      <LinearGradient
        colors={['rgba(251,251,254,0)', 'rgba(251,251,254,1)']}
        style={[styles.ctaWrap, { paddingBottom: insets.bottom + 28 }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity onPress={onOpenEditor} activeOpacity={0.9} style={styles.ctaBtn}>
          <LinearGradient colors={['#4A3AFF', '#6B5EFF', '#897FFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaBtnInner}>
            <View style={styles.ctaBtnLeft}>
              <View style={styles.ctaBtnIconWrap}>
                <Feather name="box" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.ctaBtnTitle}>지금 배치해보기</Text>
                <Text style={styles.ctaBtnSub}>3D 에디터로 가구를 자유롭게 배치하세요</Text>
              </View>
            </View>
            <View style={styles.ctaBtnArrow}>
              <Feather name="chevron-right" size={18} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* Long-press Action Menu */}
      <Modal visible={showActionMenu} transparent animationType="fade" onRequestClose={() => setShowActionMenu(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowActionMenu(false)} />
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.sheetHandleSmall} />
          {selectedItem && (
            <View style={styles.actionSheetHeader}>
              <View style={styles.actionSheetIcon}>
                <Text style={{ fontSize: 24 }}>{selectedItem.thumbnail}</Text>
              </View>
              <View>
                <Text style={styles.actionSheetName}>{selectedItem.name}</Text>
                <Text style={styles.actionSheetDim}>{selectedItem.dimensions}</Text>
              </View>
            </View>
          )}
          <View style={styles.actionGrid}>
            {actionMenuItems.map(action => (
              <TouchableOpacity key={action.label} onPress={action.action} style={styles.actionItem}>
                <View style={styles.actionItemIcon}>
                  <Feather name={action.icon as any} size={22} color={action.color} />
                </View>
                <Text style={styles.actionItemLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Add Furniture Sheet */}
      <Modal visible={showAddSheet} transparent animationType="slide" onRequestClose={() => setShowAddSheet(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddSheet(false)} />
        <View style={[styles.addSheet, { paddingBottom: insets.bottom + 32 }]}>
          <View style={styles.sheetHandleSmall} />
          <View style={styles.addSheetHeader}>
            <Text style={styles.addSheetTitle}>가구 추가</Text>
            <TouchableOpacity onPress={() => setShowAddSheet(false)} style={styles.closeBtn}>
              <Feather name="x" size={16} color="#514F6E" />
            </TouchableOpacity>
          </View>
          <Text style={styles.addSheetDesc}>카탈로그에서 선택하거나 카메라로 직접 스캔하세요</Text>
          <TouchableOpacity onPress={() => { setShowAddSheet(false); onScanFurniture(); }} style={styles.scanBtn}>
            <LinearGradient colors={['#4A3AFF', '#897FFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.scanBtnInner}>
              <Feather name="camera" size={18} color="#fff" />
              <Text style={styles.scanBtnText}>카메라로 가구 스캔하기</Text>
            </LinearGradient>
          </TouchableOpacity>
          <View style={styles.orDivider}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>또는 카탈로그에서 선택</Text>
            <View style={styles.orLine} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.addFurnitureScroll}>
            <View style={styles.addFurnitureGrid}>
              {ALL_FURNITURE.map(item => (
                <TouchableOpacity key={item.id} onPress={() => addFurnitureToRoom(item)} style={styles.addFurnitureCard}>
                  <View style={styles.addFurnitureThumbnail}>
                    <Text style={{ fontSize: 28 }}>{item.thumbnail}</Text>
                  </View>
                  <Text style={styles.addFurnitureName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.addFurnitureDim}>{item.dimensions}</Text>
                  <View style={styles.addFurnitureFooter}>
                    <Text style={styles.addFurniturePrice}>{item.price}</Text>
                    <View style={styles.addFurniturePlus}>
                      <Feather name="plus" size={12} color="#fff" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFBFE' },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.90)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.60)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  topBarTitle: { fontSize: 15, fontWeight: '700', color: '#170F49' },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  photoCounter: {
    position: 'absolute', bottom: 64, right: 16,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    backgroundColor: 'rgba(10,8,20,0.6)',
  },
  photoCounterText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  viewToggle: { position: 'absolute', bottom: 64, left: 16 },
  viewToggleInner: {
    flexDirection: 'row', padding: 4, borderRadius: 14, gap: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  viewToggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  viewToggleBtnText: { fontSize: 12, fontWeight: '700' },
  mock3D: { backgroundColor: '#EAE8FF', alignItems: 'center', justifyContent: 'center' },
  mock3DGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  mock3DItem: { width: 60, height: 60, backgroundColor: 'rgba(74,58,255,0.12)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mock3DEmoji: { fontSize: 28 },
  mock3DLabel: { fontSize: 12, color: '#514F6E', fontWeight: '600' },
  sheet: { backgroundColor: '#FBFBFE', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, paddingBottom: 160, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#D9DBE9', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetPadded: { paddingHorizontal: 20 },
  roomName: { fontSize: 24, fontWeight: '700', color: '#170F49', lineHeight: 30, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  metaText: { fontSize: 13, color: '#514F6E' },
  metaDot: { color: '#D9DBE9' },
  roomDesc: { fontSize: 13, color: '#514F6E', lineHeight: 20 },
  divider: { height: 1, backgroundColor: '#F1F2F9', marginVertical: 20, marginHorizontal: 20 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#170F49' },
  statLabel: { fontSize: 11, color: '#A0A3BD', marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: '#F1F2F9' },
  badgeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, backgroundColor: '#F1F2F9',
  },
  badgeIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  badgeTitle: { fontSize: 13, fontWeight: '700', color: '#170F49' },
  badgeSub: { fontSize: 11, color: '#A0A3BD' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#170F49' },
  sectionHint: { fontSize: 11, color: '#A0A3BD', fontWeight: '500' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { fontSize: 12, fontWeight: '600', color: '#4A3AFF' },
  floorPlan: { height: 200, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#EAE8FF', backgroundColor: '#fff', position: 'relative' },
  gridBg: { flex: 1, backgroundColor: '#fff' },
  floorPlanBorder: { position: 'absolute', top: 16, left: 16, right: 16, bottom: 16, borderWidth: 2, borderColor: 'rgba(74,58,255,0.20)', borderRadius: 8 },
  furnitureDot: {
    position: 'absolute', width: 44, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginLeft: -22, marginTop: -22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1,
  },
  furnitureDotEmoji: { fontSize: 20 },
  furnitureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 18, borderWidth: 1,
  },
  furnitureRowDefault: { backgroundColor: '#fff', borderColor: '#F1F2F9' },
  furnitureRowSelected: { backgroundColor: '#EAE8FF', borderColor: 'rgba(74,58,255,0.30)' },
  furnitureIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F2F9', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  furnitureEmoji: { fontSize: 22 },
  furnitureName: { fontSize: 13, fontWeight: '700', color: '#170F49' },
  furnitureDim: { fontSize: 11, color: '#A0A3BD', marginTop: 2 },
  furnitureActions: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  furnitureActionBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#EAE8FF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  deleteBtn: { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' },
  ctaWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
    paddingHorizontal: 20, paddingTop: 24,
  },
  ctaBtn: { borderRadius: 22, overflow: 'hidden', shadowColor: '#4A3AFF', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.38, shadowRadius: 16, elevation: 8 },
  ctaBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 },
  ctaBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ctaBtnIconWrap: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  ctaBtnTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  ctaBtnSub: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },
  ctaBtnArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.40)' },
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 10,
  },
  sheetHandleSmall: { width: 48, height: 6, backgroundColor: '#EAE8FF', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  actionSheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F2F9' },
  actionSheetIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#F1F2F9', alignItems: 'center', justifyContent: 'center' },
  actionSheetName: { fontSize: 14, fontWeight: '700', color: '#170F49' },
  actionSheetDim: { fontSize: 11, color: '#A0A3BD', marginTop: 2 },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  actionItem: { alignItems: 'center', gap: 8, flex: 1 },
  actionItemIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#F1F2F9', alignItems: 'center', justifyContent: 'center' },
  actionItemLabel: { fontSize: 11, fontWeight: '600', color: '#514F6E' },
  addSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 36, borderTopRightRadius: 36,
    paddingHorizontal: 24, paddingTop: 8,
    maxHeight: '75%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 12,
  },
  addSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  addSheetTitle: { fontSize: 20, fontWeight: '700', color: '#170F49' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F2F9', alignItems: 'center', justifyContent: 'center' },
  addSheetDesc: { fontSize: 12, color: '#A0A3BD', marginBottom: 12 },
  scanBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  scanBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14 },
  scanBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  orDivider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: '#EAE8FF' },
  orText: { fontSize: 11, fontWeight: '600', color: '#A0A3BD' },
  addFurnitureScroll: { flex: 1 },
  addFurnitureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 16 },
  addFurnitureCard: { width: '47.5%', borderRadius: 20, padding: 16, backgroundColor: '#F1F2F9', gap: 10 },
  addFurnitureThumbnail: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  addFurnitureName: { fontSize: 12, fontWeight: '700', color: '#170F49' },
  addFurnitureDim: { fontSize: 10, color: '#A0A3BD' },
  addFurnitureFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addFurniturePrice: { fontSize: 11, fontWeight: '700', color: '#4A3AFF' },
  addFurniturePlus: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#4A3AFF', alignItems: 'center', justifyContent: 'center' },
});

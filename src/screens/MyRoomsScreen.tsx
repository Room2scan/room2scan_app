import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav } from '../components/Shared';
import { MY_ROOMS } from '../data';
import { MainTab } from '../types';

const imgSrc = (src: any) => (typeof src === 'string' ? { uri: src } : src);
import { loadAllCustomRooms, CustomRoom } from '../utils/roomStorage';

// ─── Room-type display metadata ───────────────────────────────────────────────

const ROOM_TYPE_META: Record<string, { label: string; color: string; bgColor: string }> = {
  bedroom:  { label: '침실', color: '#7C3AED', bgColor: '#EDE9FE' },
  living:   { label: '거실', color: '#2563EB', bgColor: '#DBEAFE' },
  kitchen:  { label: '주방', color: '#D97706', bgColor: '#FEF3C7' },
  study:    { label: '서재', color: '#059669', bgColor: '#D1FAE5' },
  bathroom: { label: '욕실', color: '#0891B2', bgColor: '#CFFAFE' },
  custom:   { label: '커스텀', color: '#4A3AFF', bgColor: '#EAE8FF' },
};

const ROOM_TYPE_ICON: Record<string, string> = {
  bedroom: 'moon', living: 'home', kitchen: 'coffee',
  study: 'book-open', bathroom: 'droplet', custom: 'grid',
};

// ─── Custom (procedural) room card ────────────────────────────────────────────

const CustomRoomCard = ({
  room,
  onPress,
}: {
  room: CustomRoom;
  onPress: () => void;
}) => {
  const meta   = ROOM_TYPE_META[room.type] ?? ROOM_TYPE_META.custom;
  const icon   = (ROOM_TYPE_ICON[room.type] ?? 'grid') as keyof typeof Feather.glyphMap;
  const area   = (room.width * room.length).toFixed(1);

  // Scale floor-plan preview box inside the 88px tall banner
  const MAX_BOX = 64;
  const aspectW = room.width / Math.max(room.width, room.length);
  const aspectL = room.length / Math.max(room.width, room.length);
  const boxW    = Math.round(MAX_BOX * aspectW);
  const boxH    = Math.round(MAX_BOX * aspectL);

  const lastEdited = (() => {
    try {
      return new Date(room.lastEdited).toLocaleDateString('ko-KR', {
        month: 'short', day: 'numeric',
      });
    } catch {
      return '';
    }
  })();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.roomCard}>
      {/* Coloured banner with floor-plan outline */}
      <View style={[styles.customBanner, { backgroundColor: meta.bgColor }]}>
        {/* 2-D floor outline */}
        <View
          style={[
            styles.floorPlanBox,
            { width: boxW, height: boxH, borderColor: meta.color },
          ]}
        />

        {/* Room type badge (top-left) */}
        <View style={[styles.customTypeBadge, { backgroundColor: meta.color }]}>
          <Feather name={icon} size={11} color="#fff" />
          <Text style={styles.customTypeBadgeText}>{meta.label}</Text>
        </View>

        {/* Dimension label (bottom-left) */}
        <Text style={[styles.customDimensionText, { color: meta.color }]}>
          {room.width} × {room.length} × {room.height} m
        </Text>

        {/* "3D ROOM" badge (bottom-right) */}
        <View style={styles.badge3D}>
          <Feather name="box" size={10} color="rgba(137,127,255,1)" />
          <Text style={styles.badge3DText}>3D ROOM</Text>
        </View>
      </View>

      {/* Info row */}
      <View style={styles.infoRow}>
        <View style={styles.infoLeft}>
          <View style={styles.nameRow}>
            <Text style={styles.roomName}>{room.name}</Text>
            <View style={styles.editableBadge}>
              <Text style={styles.editableText}>편집 가능</Text>
            </View>
          </View>
          <Text style={styles.roomMeta}>
            {area}m² · 가구 {room.furnitureCount}개
          </Text>
        </View>
        <View style={styles.timeRow}>
          <Feather name="clock" size={10} color="#A0A3BD" />
          <Text style={styles.timeText}>{lastEdited}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Static (preset) room card — unchanged from before ────────────────────────

const StaticRoomCard = ({
  room,
  onPress,
}: {
  room: (typeof MY_ROOMS)[number];
  onPress: () => void;
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.roomCard}>
    {/* Images row */}
    <View style={styles.imagesRow}>
      <View style={styles.heroImageWrap}>
        <Image
          source={typeof room.heroImage === 'string' ? { uri: room.heroImage } : room.heroImage}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        <View style={styles.badge3D}>
          <Feather name="box" size={10} color="rgba(137,127,255,1)" />
          <Text style={styles.badge3DText}>3D VIEW</Text>
        </View>
        {room.isFeatured && (
          <View style={styles.featuredBadge}>
            <Feather name="star" size={7} color="#fff" />
            <Text style={styles.featuredText}>대표</Text>
          </View>
        )}
      </View>
      <View style={styles.realPhotosCol}>
        {room.realPhotos.slice(1, 3).map((photo, pi) => (
          <View key={pi} style={[styles.realPhotoWrap, pi === 0 && { marginBottom: 2 }]}>
            <Image
              source={imgSrc(photo)}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            {pi === 1 && (
              <View style={styles.realPhotoOverlay}>
                <Text style={styles.realPhotoText}>+{room.realPhotos.length - 2}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>

    {/* Info row */}
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <View style={styles.nameRow}>
          <Text style={styles.roomName}>{room.name}</Text>
          <View style={styles.editableBadge}>
            <Text style={styles.editableText}>편집 가능</Text>
          </View>
        </View>
        <Text style={styles.roomMeta}>{room.area} · 가구 {room.furnitureCount}개</Text>
      </View>
      <View style={styles.timeRow}>
        <Feather name="clock" size={10} color="#A0A3BD" />
        <Text style={styles.timeText}>{room.lastEdited}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

// ─── Main screen ──────────────────────────────────────────────────────────────

interface MyRoomsScreenProps {
  rooms?: (typeof MY_ROOMS)[number][];
  refreshKey?: number;
  onOpenRoom: (roomId: string) => void;
  onAddRoom: () => void;
  onScanRoom?: () => void;
  onTabChange: (t: MainTab) => void;
}

export const MyRoomsScreen = ({
  rooms = MY_ROOMS,
  refreshKey = 0,
  onOpenRoom,
  onAddRoom,
  onScanRoom,
  onTabChange,
}: MyRoomsScreenProps) => {
  const insets = useSafeAreaInsets();
  const [customRooms, setCustomRooms] = useState<CustomRoom[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Load from AsyncStorage on mount (screen remounts on each navigation)
  useEffect(() => {
    let alive = true;
    loadAllCustomRooms()
      .then(rooms => {
        if (alive) {
          setCustomRooms(rooms);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [refreshKey]);

  const isEmpty = !loading && customRooms.length === 0 && rooms.length === 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.headerSub}>My Spaces</Text>
        <Text style={styles.headerTitle}>내 방</Text>
        {!loading && customRooms.length > 0 && (
          <Text style={styles.headerCount}>
            직접 만든 방 {customRooms.length}개
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#4A3AFF" />
          </View>
        ) : isEmpty ? (
          /* Empty state */
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Feather name="home" size={32} color="#A0A3BD" />
            </View>
            <Text style={styles.emptyTitle}>방이 없어요</Text>
            <Text style={styles.emptyDesc}>아래 버튼으로 첫 번째 방을 추가해 보세요</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {/* Custom rooms — newest first (index order = creation order reversed) */}
            {customRooms.map(room => (
              <CustomRoomCard
                key={room.id}
                room={room}
                onPress={() => onOpenRoom(room.id)}
              />
            ))}

            {/* Divider between custom + preset rooms */}
            {customRooms.length > 0 && rooms.length > 0 && (
              <View style={styles.sectionDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>샘플 방</Text>
                <View style={styles.dividerLine} />
              </View>
            )}

            {/* Preset / static rooms */}
            {rooms.map(room => (
              <StaticRoomCard
                key={room.id}
                room={room}
                onPress={() => onOpenRoom(room.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <View style={styles.fabContainer}>
        <TouchableOpacity onPress={() => setShowAddModal(true)} activeOpacity={0.88} style={styles.fab}>
          <Feather name="plus" size={20} color="#fff" />
          <Text style={styles.fabText}>새 방 추가하기</Text>
        </TouchableOpacity>
      </View>

      {/* 새 방 추가 모달 */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + 24 }]} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>새 방 만들기</Text>
            <Text style={styles.modalSubtitle}>어떻게 시작할까요?</Text>

            {/* 치수로 시작하기 */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.modalOption}
              onPress={() => { setShowAddModal(false); onAddRoom(); }}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: '#EAE8FF' }]}>
                <Feather name="edit-3" size={22} color="#4A3AFF" />
              </View>
              <View style={styles.modalOptionText}>
                <Text style={styles.modalOptionTitle}>치수로 시작하기</Text>
                <Text style={styles.modalOptionDesc}>수치를 입력해서 시작해요</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#A0A3BD" />
            </TouchableOpacity>

            {/* 스캔으로 시작하기 */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.modalOption}
              onPress={() => { setShowAddModal(false); onScanRoom?.(); }}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: '#E0EDFF' }]}>
                <Feather name="camera" size={22} color="#2563EB" />
              </View>
              <View style={styles.modalOptionText}>
                <Text style={[styles.modalOptionTitle, { color: '#2563EB' }]}>스캔으로 시작하기</Text>
                <Text style={styles.modalOptionDesc}>카메라로 방을 촬영해서 시작해요</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#A0A3BD" />
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <BottomNav activeTab="rooms" onTabChange={onTabChange} />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFBFE' },

  // Header
  header: { paddingBottom: 16, paddingHorizontal: 20, flexShrink: 0 },
  headerSub: {
    fontSize: 12, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 4, color: '#A0A3BD', marginBottom: 2,
  },
  headerTitle:  { fontSize: 24, fontWeight: '700', color: '#170F49' },
  headerCount:  { fontSize: 12, color: '#514F6E', marginTop: 2 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 144 },
  list: { gap: 16 },

  // Loading / empty
  loadingWrap: { paddingTop: 60, alignItems: 'center' },
  emptyWrap:   { paddingTop: 60, alignItems: 'center', gap: 12 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#F1F2F9', alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#514F6E' },
  emptyDesc:  { fontSize: 13, color: '#A0A3BD', textAlign: 'center', lineHeight: 20 },

  // Section divider
  sectionDivider: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4,
  },
  dividerLine:  { flex: 1, height: 1, backgroundColor: '#E9EAF0' },
  dividerLabel: { fontSize: 11, fontWeight: '600', color: '#A0A3BD', letterSpacing: 1 },

  // Shared room card shell
  roomCard: {
    borderRadius: 20, overflow: 'hidden', backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#F1F2F9',
  },

  // ── Custom room card ──────────────────────────────────────────────
  customBanner: {
    height: 140, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  floorPlanBox: {
    borderWidth: 2, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  customTypeBadge: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  customTypeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  customDimensionText: {
    position: 'absolute', bottom: 10, left: 12,
    fontSize: 11, fontWeight: '600',
  },

  // ── Static room card ──────────────────────────────────────────────
  // aspectRatio: (1/1) for square photos. Left col = 62% width × full height
  // Right col = 38% width × 2 stacked halves. Height driven by left col 1:1 ratio.
  imagesRow: { flexDirection: 'row', gap: 2 },
  heroImageWrap: { flex: 62, aspectRatio: 0.9, backgroundColor: '#F1F2F9', overflow: 'hidden' },
  featuredBadge: {
    position: 'absolute', top: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#4A3AFF', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  featuredText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  realPhotosCol: { flex: 38, gap: 2 },
  realPhotoWrap: { flex: 1, backgroundColor: '#F1F2F9', overflow: 'hidden' },
  realPhotoOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center', justifyContent: 'center',
  },
  realPhotoText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // ── Shared badge ─────────────────────────────────────────────────
  badge3D: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: 'rgba(10,8,30,0.65)',
  },
  badge3DText: { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  // ── Shared info row ───────────────────────────────────────────────
  infoRow: {
    paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
  },
  infoLeft:    { flex: 1, minWidth: 0 },
  nameRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  roomName:    { fontSize: 15, fontWeight: '700', color: '#170F49' },
  editableBadge: {
    backgroundColor: '#EAE8FF', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  editableText: { fontSize: 10, fontWeight: '600', color: '#4A3AFF' },
  roomMeta:     { fontSize: 12, color: '#514F6E' },
  timeRow:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  timeText:     { fontSize: 11, color: '#A0A3BD' },

  // FAB
  fabContainer: {
    position: 'absolute', bottom: 112, left: 0, right: 0,
    alignItems: 'center', zIndex: 30,
  },
  fab: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#4A3AFF', borderRadius: 22,
    paddingHorizontal: 24, paddingVertical: 16,
    shadowColor: '#4A3AFF', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38, shadowRadius: 14, elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // 새 방 추가 모달
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 16,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E9EAF0', alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#170F49', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#A0A3BD', marginBottom: 24 },
  modalOption: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#FBFBFE', borderRadius: 20,
    padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: '#F1F2F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  modalOptionIcon: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  modalOptionText: { flex: 1 },
  modalOptionTitle: { fontSize: 15, fontWeight: '700', color: '#170F49', marginBottom: 2 },
  modalOptionDesc: { fontSize: 12, color: '#A0A3BD' },
});

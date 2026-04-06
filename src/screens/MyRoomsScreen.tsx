import React from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Text } from '../components/Typography';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MY_ROOMS } from '../data';

export const MyRoomsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.headerSub}>My Spaces</Text>
        <Text style={styles.headerTitle}>내 방</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.list}>
          {MY_ROOMS.map(room => (
            <TouchableOpacity
              key={room.id}
              onPress={() => navigation.navigate('RoomDetail', { roomId: room.id })}
              activeOpacity={0.9}
              style={styles.roomCard}
            >
              {/* Images row */}
              <View style={styles.imagesRow}>
                {/* Hero image */}
                <View style={styles.heroImageWrap}>
                  <Image source={{ uri: room.heroImage }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
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
                {/* Real photos */}
                <View style={styles.realPhotosCol}>
                  {room.realPhotos.map((photo, pi) => (
                    <View key={pi} style={styles.realPhotoWrap}>
                      <Image source={{ uri: photo }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                      {pi === room.realPhotos.length - 1 && (
                        <View style={styles.realPhotoOverlay}>
                          <Text style={styles.realPhotoText}>실제 사진</Text>
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
          ))}
        </View>
      </ScrollView>

      {/* FAB */}
      <View style={styles.fabContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('Camera', { mode: 'room' })} activeOpacity={0.88} style={styles.fab}>
          <Feather name="plus" size={20} color="#fff" />
          <Text style={styles.fabText}>새 방 추가하기</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFBFE' },
  header: { paddingBottom: 16, paddingHorizontal: 20, flexShrink: 0 },
  headerSub: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 4, color: '#A0A3BD', marginBottom: 2 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#170F49' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 144 },
  list: { gap: 16 },
  roomCard: {
    borderRadius: 20, overflow: 'hidden', backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#F1F2F9',
  },
  imagesRow: { flexDirection: 'row', height: 176, gap: 2 },
  heroImageWrap: { flex: 1, position: 'relative', overflow: 'hidden' },
  badge3D: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: 'rgba(10,8,30,0.65)',
  },
  badge3DText: { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  featuredBadge: {
    position: 'absolute', top: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#4A3AFF', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
  },
  featuredText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  realPhotosCol: { width: '34%', gap: 2 },
  realPhotoWrap: { flex: 1, position: 'relative', overflow: 'hidden' },
  realPhotoOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.28)', alignItems: 'center', justifyContent: 'center',
  },
  realPhotoText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  infoRow: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  infoLeft: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  roomName: { fontSize: 15, fontWeight: '700', color: '#170F49' },
  editableBadge: { backgroundColor: '#EAE8FF', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  editableText: { fontSize: 10, fontWeight: '600', color: '#4A3AFF' },
  roomMeta: { fontSize: 12, color: '#514F6E' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  timeText: { fontSize: 11, color: '#A0A3BD' },
  fabContainer: { position: 'absolute', bottom: 112, left: 0, right: 0, alignItems: 'center', zIndex: 30 },
  fab: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#4A3AFF', borderRadius: 22, paddingHorizontal: 24, paddingVertical: 16,
    shadowColor: '#4A3AFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.38, shadowRadius: 14, elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

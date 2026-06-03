import { FurnitureItem, RoomProject, HeroBanner, CatalogCategory } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// ReplicaCAD frl_apartment objects  (92 GLBs)
// id = GLB filename without extension = catalogId sent to Unity
// ─────────────────────────────────────────────────────────────────────────────
export const ALL_FURNITURE: FurnitureItem[] = [
  // ── Seating ───────────────────────────────────────────────────────────────
  { id: 'frl_apartment_sofa',                  name: '소파',           type: 'Sofa',        dimensions: '-', price: '₩89,000', thumbnail: '🛋️', color: '#D9DBE9', isWishlisted: true,  rating: 4.8 },
  { id: 'frl_apartment_beanbag',               name: '빈백',           type: 'Chair',       dimensions: '-', price: '₩145,000', thumbnail: '🫘', color: '#897FFF', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_chair_01',              name: '의자 1',         type: 'Chair',       dimensions: '-', price: '₩125,000', thumbnail: '🪑', color: '#897FFF', isWishlisted: true,  rating: 4.5 },
  { id: 'frl_apartment_chair_04',              name: '의자 4',         type: 'Chair',       dimensions: '-', price: '₩135,000', thumbnail: '🪑', color: '#897FFF', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_chair_05',              name: '의자 5',         type: 'Chair',       dimensions: '-', price: '₩79,000', thumbnail: '🪑', color: '#897FFF', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_stool_02',              name: '스툴',           type: 'Chair',       dimensions: '-', price: '₩290,000', thumbnail: '🪑', color: '#897FFF', isWishlisted: false, rating: 4.0 },

  // ── Tables ────────────────────────────────────────────────────────────────
  { id: 'frl_apartment_table_01',              name: '테이블 1',       type: 'Table',       dimensions: '-', price: '₩260,000', thumbnail: '🪵', color: '#C7D2FE', isWishlisted: true,  rating: 4.5 },
  { id: 'frl_apartment_table_02',              name: '테이블 2',       type: 'Table',       dimensions: '-', price: '₩310,000', thumbnail: '🪵', color: '#C7D2FE', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_table_03',              name: '테이블 3',       type: 'Table',       dimensions: '-', price: '₩275,000', thumbnail: '🪵', color: '#C7D2FE', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_table_04',              name: '테이블 4',       type: 'Table',       dimensions: '-', price: '₩185,000', thumbnail: '🪵', color: '#C7D2FE', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_tvstand',               name: 'TV 스탠드',      type: 'Table',       dimensions: '-', price: '₩320,000', thumbnail: '🪵', color: '#C7D2FE', isWishlisted: false, rating: 4.0 },

  // ── Shelves / Storage ─────────────────────────────────────────────────────
  { id: 'frl_apartment_cabinet',               name: '캐비넷',         type: 'Shelf',       dimensions: '-', price: '₩165,000', thumbnail: '🗄️', color: '#EAE8FF', isWishlisted: true,  rating: 4.5 },
  { id: 'frl_apartment_rack_01',               name: '랙 선반',        type: 'Shelf',       dimensions: '-', price: '₩195,000', thumbnail: '🗄️', color: '#EAE8FF', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_wall_cabinet_01',       name: '벽 캐비넷 1',    type: 'Shelf',       dimensions: '-', price: '₩195,000', thumbnail: '🗄️', color: '#EAE8FF', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_wall_cabinet_02',       name: '벽 캐비넷 2',    type: 'Shelf',       dimensions: '-', price: '₩215,000', thumbnail: '🗄️', color: '#EAE8FF', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_wall_cabinet_03',       name: '벽 캐비넷 3',    type: 'Shelf',       dimensions: '-', price: '₩35,000', thumbnail: '🗄️', color: '#EAE8FF', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_basket',                name: '바구니',         type: 'Shelf',       dimensions: '-', price: '₩25,000', thumbnail: '🧺', color: '#FEF3C7', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_box',                   name: '상자',           type: 'Shelf',       dimensions: '-', price: '₩18,000', thumbnail: '📦', color: '#FEF3C7', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_shoebox_01',            name: '신발 상자',      type: 'Shelf',       dimensions: '-', price: '₩28,000', thumbnail: '📦', color: '#FEF3C7', isWishlisted: false, rating: 4.0 },

  // ── Kitchen ───────────────────────────────────────────────────────────────
  { id: 'frl_apartment_bowl_01',               name: '그릇 1',         type: 'Kitchen',     dimensions: '-', price: '₩28,000', thumbnail: '🍜', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_bowl_02',               name: '그릇 2',         type: 'Kitchen',     dimensions: '-', price: '₩32,000', thumbnail: '🍜', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_bowl_03',               name: '그릇 3',         type: 'Kitchen',     dimensions: '-', price: '₩28,000', thumbnail: '🍜', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_bowl_06',               name: '그릇 6',         type: 'Kitchen',     dimensions: '-', price: '₩28,000', thumbnail: '🍜', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_bowl_07',               name: '그릇 7',         type: 'Kitchen',     dimensions: '-', price: '₩12,000', thumbnail: '🍜', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_cup_01',                name: '컵 1',           type: 'Kitchen',     dimensions: '-', price: '₩12,000', thumbnail: '☕', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_cup_02',                name: '컵 2',           type: 'Kitchen',     dimensions: '-', price: '₩14,000', thumbnail: '☕', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_cup_03',                name: '컵 3',           type: 'Kitchen',     dimensions: '-', price: '₩14,000', thumbnail: '☕', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_cup_05',                name: '컵 5',           type: 'Kitchen',     dimensions: '-', price: '₩18,000', thumbnail: '☕', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_plate_01',              name: '접시 1',         type: 'Kitchen',     dimensions: '-', price: '₩18,000', thumbnail: '🍽️', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_plate_02',              name: '접시 2',         type: 'Kitchen',     dimensions: '-', price: '₩65,000', thumbnail: '🍽️', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_pan_01',                name: '프라이팬',       type: 'Kitchen',     dimensions: '-', price: '₩85,000', thumbnail: '🍳', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_knifeblock',            name: '칼 블록',        type: 'Kitchen',     dimensions: '-', price: '₩35,000', thumbnail: '🔪', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_choppingboard_02',      name: '도마',           type: 'Kitchen',     dimensions: '-', price: '₩12,000', thumbnail: '🪵', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_sponge_dish',           name: '스폰지 받침',    type: 'Kitchen',     dimensions: '-', price: '₩8,000', thumbnail: '🧽', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_kitchen_utensil_01',    name: '주방 도구 1',    type: 'Kitchen',     dimensions: '-', price: '₩8,000', thumbnail: '🥄', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_kitchen_utensil_02',    name: '주방 도구 2',    type: 'Kitchen',     dimensions: '-', price: '₩8,000', thumbnail: '🥄', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_kitchen_utensil_03',    name: '주방 도구 3',    type: 'Kitchen',     dimensions: '-', price: '₩8,000', thumbnail: '🥄', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_kitchen_utensil_04',    name: '주방 도구 4',    type: 'Kitchen',     dimensions: '-', price: '₩8,000', thumbnail: '🥄', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_kitchen_utensil_05',    name: '주방 도구 5',    type: 'Kitchen',     dimensions: '-', price: '₩8,000', thumbnail: '🥄', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_kitchen_utensil_06',    name: '주방 도구 6',    type: 'Kitchen',     dimensions: '-', price: '₩8,000', thumbnail: '🥄', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_kitchen_utensil_08',    name: '주방 도구 8',    type: 'Kitchen',     dimensions: '-', price: '₩8,000', thumbnail: '🥄', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_kitchen_utensil_09',    name: '주방 도구 9',    type: 'Kitchen',     dimensions: '-', price: '₩890,000', thumbnail: '🥄', color: '#FEE2E2', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_refrigerator',          name: '냉장고',         type: 'Kitchen',     dimensions: '-', price: '₩125,000', thumbnail: '🧊', color: '#D1FAE5', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_small_appliance_01',    name: '소형 가전 1',    type: 'Kitchen',     dimensions: '-', price: '₩98,000', thumbnail: '🫙', color: '#D1FAE5', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_small_appliance_02',    name: '소형 가전 2',    type: 'Kitchen',     dimensions: '-', price: '₩680,000', thumbnail: '🫙', color: '#D1FAE5', isWishlisted: false, rating: 4.0 },

  // ── Electronics ───────────────────────────────────────────────────────────
  { id: 'frl_apartment_tv_object',             name: 'TV',             type: 'Electronics', dimensions: '-', price: '₩520,000', thumbnail: '📺', color: '#DBEAFE', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_tv_screen',             name: 'TV 스크린',      type: 'Electronics', dimensions: '-', price: '₩340,000', thumbnail: '📺', color: '#DBEAFE', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_monitor',               name: '모니터',         type: 'Electronics', dimensions: '-', price: '₩65,000', thumbnail: '🖥️', color: '#DBEAFE', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_monitor_stand',         name: '모니터 스탠드',  type: 'Electronics', dimensions: '-', price: '₩45,000', thumbnail: '🖥️', color: '#DBEAFE', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_setupbox',              name: '셋탑박스',       type: 'Electronics', dimensions: '-', price: '₩280,000', thumbnail: '📦', color: '#DBEAFE', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_camera_02',             name: '카메라',         type: 'Electronics', dimensions: '-', price: '₩15,000', thumbnail: '📷', color: '#DBEAFE', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_remote-control_01',     name: '리모컨',         type: 'Electronics', dimensions: '-', price: '₩95,000', thumbnail: '📱', color: '#DBEAFE', isWishlisted: false, rating: 4.0 },

  // ── Decor / Lighting ──────────────────────────────────────────────────────
  { id: 'frl_apartment_lamp_01',               name: '램프 1',         type: 'Decor',       dimensions: '-', price: '₩85,000', thumbnail: '💡', color: '#FEF9C3', isWishlisted: true,  rating: 4.5 },
  { id: 'frl_apartment_lamp_02',               name: '램프 2',         type: 'Decor',       dimensions: '-', price: '₩45,000', thumbnail: '💡', color: '#FEF9C3', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_indoor_plant_01',       name: '실내 식물 1',    type: 'Decor',       dimensions: '-', price: '₩38,000', thumbnail: '🌿', color: '#D1FAE5', isWishlisted: true,  rating: 4.5 },
  { id: 'frl_apartment_indoor_plant_02',       name: '실내 식물 2',    type: 'Decor',       dimensions: '-', price: '₩55,000', thumbnail: '🌿', color: '#D1FAE5', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_vase_01',               name: '꽃병 1',         type: 'Decor',       dimensions: '-', price: '₩65,000', thumbnail: '🏺', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_vase_02',               name: '꽃병 2',         type: 'Decor',       dimensions: '-', price: '₩120,000', thumbnail: '🏺', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_picture_01',            name: '그림 1',         type: 'Decor',       dimensions: '-', price: '₩95,000', thumbnail: '🖼️', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_picture_02',            name: '그림 2',         type: 'Decor',       dimensions: '-', price: '₩110,000', thumbnail: '🖼️', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_picture_03',            name: '그림 3',         type: 'Decor',       dimensions: '-', price: '₩130,000', thumbnail: '🖼️', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_picture_04',            name: '그림 4',         type: 'Decor',       dimensions: '-', price: '₩75,000', thumbnail: '🖼️', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_clock',                 name: '시계',           type: 'Decor',       dimensions: '-', price: '₩42,000', thumbnail: '🕐', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_cushion_01',            name: '쿠션 1',         type: 'Decor',       dimensions: '-', price: '₩42,000', thumbnail: '🛋️', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_cushion_03',            name: '쿠션 3',         type: 'Decor',       dimensions: '-', price: '₩185,000', thumbnail: '🛋️', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_rug_01',                name: '러그 1',         type: 'Decor',       dimensions: '-', price: '₩215,000', thumbnail: '🟫', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_rug_02',                name: '러그 2',         type: 'Decor',       dimensions: '-', price: '₩65,000', thumbnail: '🟫', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_mat',                   name: '매트',           type: 'Decor',       dimensions: '-', price: '₩22,000', thumbnail: '🟫', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_towel',                 name: '타올',           type: 'Decor',       dimensions: '-', price: '₩35,000', thumbnail: '🧻', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_cloth_01',              name: '패브릭 1',       type: 'Decor',       dimensions: '-', price: '₩35,000', thumbnail: '🧣', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_cloth_02',              name: '패브릭 2',       type: 'Decor',       dimensions: '-', price: '₩38,000', thumbnail: '🧣', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_cloth_03',              name: '패브릭 3',       type: 'Decor',       dimensions: '-', price: '₩38,000', thumbnail: '🧣', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_cloth_04',              name: '패브릭 4',       type: 'Decor',       dimensions: '-', price: '₩18,000', thumbnail: '🧣', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_book_01',               name: '책 1',           type: 'Decor',       dimensions: '-', price: '₩22,000', thumbnail: '📚', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_book_02',               name: '책 2',           type: 'Decor',       dimensions: '-', price: '₩16,000', thumbnail: '📚', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_book_03',               name: '책 3',           type: 'Decor',       dimensions: '-', price: '₩24,000', thumbnail: '📚', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_book_04',               name: '책 4',           type: 'Decor',       dimensions: '-', price: '₩19,000', thumbnail: '📚', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_book_05',               name: '책 5',           type: 'Decor',       dimensions: '-', price: '₩21,000', thumbnail: '📚', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_book_06',               name: '책 6',           type: 'Decor',       dimensions: '-', price: '₩450,000', thumbnail: '📚', color: '#F1F2F9', isWishlisted: false, rating: 4.0 },

  // ── Other / Misc ──────────────────────────────────────────────────────────
  { id: 'frl_apartment_bike_01',               name: '자전거 1',       type: 'Other',       dimensions: '-', price: '₩380,000', thumbnail: '🚲', color: '#F3F4F6', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_bike_02',               name: '자전거 2',       type: 'Other',       dimensions: '-', price: '₩380,000', thumbnail: '🚲', color: '#F3F4F6', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_bin_01',                name: '쓰레기통 1',     type: 'Other',       dimensions: '-', price: '₩380,000', thumbnail: '🗑️', color: '#F3F4F6', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_bin_02',                name: '쓰레기통 2',     type: 'Other',       dimensions: '-', price: '₩380,000', thumbnail: '🗑️', color: '#F3F4F6', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_bin_03',                name: '쓰레기통 3',     type: 'Other',       dimensions: '-', price: '₩380,000', thumbnail: '🗑️', color: '#F3F4F6', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_clothes_hanger_01',     name: '옷걸이 1',       type: 'Other',       dimensions: '-', price: '₩380,000', thumbnail: '👔', color: '#F3F4F6', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_clothes_hanger_02',     name: '옷걸이 2',       type: 'Other',       dimensions: '-', price: '₩380,000', thumbnail: '👔', color: '#F3F4F6', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_handbag',               name: '핸드백',         type: 'Other',       dimensions: '-', price: '₩380,000', thumbnail: '👜', color: '#F3F4F6', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_shoe_01',               name: '신발 1',         type: 'Other',       dimensions: '-', price: '₩380,000', thumbnail: '👟', color: '#F3F4F6', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_shoe_02',               name: '신발 2',         type: 'Other',       dimensions: '-', price: '₩380,000', thumbnail: '👟', color: '#F3F4F6', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_shoe_03',               name: '신발 3',         type: 'Other',       dimensions: '-', price: '₩380,000', thumbnail: '👟', color: '#F3F4F6', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_shoe_04',               name: '신발 4',         type: 'Other',       dimensions: '-', price: '₩380,000', thumbnail: '👟', color: '#F3F4F6', isWishlisted: false, rating: 4.0 },
  { id: 'frl_apartment_umbrella',              name: '우산',           type: 'Other',       dimensions: '-', price: '₩380,000', thumbnail: '☂️', color: '#F3F4F6', isWishlisted: false, rating: 4.0 },

  // ── 내 가구 (스캔) ─────────────────────────────────────────────────────────
  { id: 'mf1', name: '내 소파 (스캔)',   type: 'Sofa',  dimensions: '210×90 cm', price: '직접 스캔', thumbnail: '🛋️', color: '#4A3AFF', isWishlisted: false, rating: 5.0, isMyFurniture: true },
  { id: 'mf2', name: '원목 책상 (스캔)', type: 'Table', dimensions: '140×70 cm', price: '직접 스캔', thumbnail: '🪵', color: '#897FFF', isWishlisted: false, rating: 5.0, isMyFurniture: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// ReplicaCAD dataset root (same as unityBridge.ts constant)
// ─────────────────────────────────────────────────────────────────────────────
import { Platform } from 'react-native';

// Android 에뮬레이터/기기는 /sdcard, Windows 개발은 로컬 경로
const RCA = Platform.OS === 'android'
  ? '/data/user/0/com.scan2room.app/files/replica_cad'
  : 'E:\\unity\\replica_cad_data';

const SEP = Platform.OS === 'android' ? '/' : '\\';
const STAGE_GLB   = `${RCA}${SEP}stages${SEP}frl_apartment_stage.glb`;
const OBJECTS_DIR = `${RCA}${SEP}objects`;
const LOCAL_ROOM_ROOT = Platform.OS === 'android'
  ? '/data/user/0/com.scan2room.app/files/room2scan_local_rooms/room1'
  : 'C:\\Users\\park\\Downloads\\unity_delivery_room1_final (1)\\unity_delivery_room1_final';
const LOCAL_ROOM_GLB = `${LOCAL_ROOM_ROOT}${SEP}unity_y_up${SEP}room${SEP}room1_empty_floor_wall.glb`;
const LOCAL_ROOM_MANIFEST = `${LOCAL_ROOM_ROOT}${SEP}metadata${SEP}room1_unity_delivery_manifest.json`;

// 2D furniture positions are derived from scene_instance.json translations:
//   norm_x = (tx + 5.5) / 11 * 100   (room width  ≈ 11 m, x: −5.5 → 5.5)
//   norm_y = (tz + 1.5) / 10 * 100   (room depth  ≈ 10 m, z: −1.5 → 8.5)

export const MY_ROOMS: RoomProject[] = [
  {
    id: 'r1',
    name: '안방',
    area: '2.8 m²',
    furnitureCount: 12,
    lastEdited: '2일 전',
    gradient: 'from-[#4A3AFF]/20 to-[#897FFF]/10',
    meshColor: '#897FFF',
    isFeatured: true,
    description: 'ReplicaCAD apt_0 배치. 소파·러그·테이블·의자가 실제 3D 위치로 로드됩니다.',
    heroImage: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80',
    realPhotos: [
      'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=400&q=75',
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400&q=75',
    ],
    // apt_0 key objects — positions computed from scene_instance.json translations
    furniture: [
      { id: 'rf1', name: '소파',        thumbnail: '🛋️', dimensions: '-', x: 86, y: 68, rotation: 90  },
      { id: 'rf2', name: '테이블',      thumbnail: '🪵', dimensions: '-', x: 88, y: 81, rotation: 0   },
      { id: 'rf3', name: '러그',        thumbnail: '🟫', dimensions: '-', x: 73, y: 71, rotation: 25  },
      { id: 'rf4', name: '의자',        thumbnail: '🪑', dimensions: '-', x: 68, y: 90, rotation: 0   },
      { id: 'rf5', name: '벽 캐비넷',   thumbnail: '🗄️', dimensions: '-', x: 88, y: 55, rotation: 90  },
      { id: 'rf6', name: '실내 식물',   thumbnail: '🌿', dimensions: '-', x: 56, y: 60, rotation: 0   },
      { id: 'rf7', name: '러그 2',      thumbnail: '🟫', dimensions: '-', x: 62, y: 38, rotation: 45  },
      { id: 'rf8', name: '스툴',        thumbnail: '🪑', dimensions: '-', x: 87, y: 39, rotation: 0   },
    ],
    // ── 3D scene ──────────────────────────────────────────────────────────────
    glbPath:              LOCAL_ROOM_GLB,
    deliveryManifestPath: LOCAL_ROOM_MANIFEST,
    objectsBasePath:      LOCAL_ROOM_ROOT,
  },
  {
    id: 'r2',
    name: '거실',
    area: '24.1 m²',
    furnitureCount: 126,
    lastEdited: '1주일 전',
    gradient: 'from-[#897FFF]/20 to-[#EAE8FF]/60',
    meshColor: '#4A3AFF',
    isFeatured: false,
    description: 'ReplicaCAD apt_1 배치. 소파·의자·테이블 등 126개 오브젝트가 실제 위치로 배치됩니다.',
    heroImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    realPhotos: [
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400&q=75',
      'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=400&q=75',
    ],
    // apt_1 key objects
    furniture: [
      { id: 'rf1', name: '소파',        thumbnail: '🛋️', dimensions: '-', x: 86, y: 33, rotation: 90  },
      { id: 'rf2', name: '의자',        thumbnail: '🪑', dimensions: '-', x: 55, y: 25, rotation: 210 },
      { id: 'rf3', name: '러그',        thumbnail: '🟫', dimensions: '-', x: 65, y: 45, rotation: 0   },
      { id: 'rf4', name: '테이블',      thumbnail: '🪵', dimensions: '-', x: 70, y: 55, rotation: 15  },
      { id: 'rf5', name: '실내 식물',   thumbnail: '🌿', dimensions: '-', x: 30, y: 70, rotation: 0   },
      { id: 'rf6', name: '램프',        thumbnail: '💡', dimensions: '-', x: 82, y: 60, rotation: 0   },
    ],
    // ── 3D scene ──────────────────────────────────────────────────────────────
    glbPath:         STAGE_GLB,
    sceneJsonPath:   `${RCA}${SEP}configs${SEP}scenes${SEP}apt_1.scene_instance.json`,
    objectsBasePath: OBJECTS_DIR,
  },
  {
    id: 'r3',
    name: '작업실',
    area: '8.2 m²',
    furnitureCount: 125,
    lastEdited: '3주일 전',
    gradient: 'from-[#EAE8FF] to-[#D9DBE9]/60',
    meshColor: '#A0A3BD',
    isFeatured: false,
    description: 'ReplicaCAD apt_2 배치. 소파·테이블·램프 등 125개 오브젝트가 실제 위치로 배치됩니다.',
    heroImage: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80',
    realPhotos: [
      'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=75',
      'https://images.unsplash.com/photo-1547119957-637f8679db1e?w=400&q=75',
    ],
    // apt_2 key objects
    furniture: [
      { id: 'rf1', name: '소파',        thumbnail: '🛋️', dimensions: '-', x: 85, y: 31, rotation: 90  },
      { id: 'rf2', name: '테이블 2',    thumbnail: '🪵', dimensions: '-', x: 55, y: 30, rotation: 90  },
      { id: 'rf3', name: '테이블 4',    thumbnail: '🪵', dimensions: '-', x: 75, y: 31, rotation: 0   },
      { id: 'rf4', name: '램프',        thumbnail: '💡', dimensions: '-', x: 55, y: 71, rotation: 0   },
      { id: 'rf5', name: '상자',        thumbnail: '📦', dimensions: '-', x: 55, y: 61, rotation: 90  },
      { id: 'rf6', name: '쓰레기통',    thumbnail: '🗑️', dimensions: '-', x: 45, y:  6, rotation: 0   },
    ],
    // ── 3D scene ──────────────────────────────────────────────────────────────
    glbPath:         STAGE_GLB,
    sceneJsonPath:   `${RCA}${SEP}configs${SEP}scenes${SEP}apt_2.scene_instance.json`,
    objectsBasePath: OBJECTS_DIR,
  },
];

export const HERO_BANNERS: HeroBanner[] = [
  {
    id: 'b1', label: '봄맞이 인테리어', headline: '봄맞이 새단장',
    subtext: '디자이너가 샛노랑 포인트 한방울 담아 완성한 5평 자취방',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    ctaText: '스타일 보기', overlayFrom: 'rgba(30,20,0,0.45)', overlayTo: 'rgba(0,0,0,0.0)',
  },
  {
    id: 'b2', label: '미니멀 거실', headline: '여백의 미학',
    subtext: '군더더기 없는 스칸디나비아 스타일로 완성하는 거실',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    ctaText: '둘러보기', overlayFrom: 'rgba(10,20,40,0.55)', overlayTo: 'rgba(0,0,0,0.0)',
  },
  {
    id: 'b3', label: '소파 컬렉션', headline: '편안함의 기준',
    subtext: '오래 앉아도 피곤하지 않은 소파, 직접 확인해보세요',
    imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80',
    ctaText: '컬렉션 보기', overlayFrom: 'rgba(20,10,30,0.5)', overlayTo: 'rgba(0,0,0,0.0)',
  },
];

export const CATEGORY_TABS: { id: CatalogCategory; label: string; icon: string }[] = [
  { id: 'wishlist',     label: '찜한 목록', icon: '❤️'  },
  { id: 'sofa',         label: '소파',      icon: '🛋️' },
  { id: 'chair',        label: '의자',      icon: '🪑'  },
  { id: 'table',        label: '테이블',    icon: '🪵'  },
  { id: 'shelf',        label: '수납',      icon: '🗄️' },
  { id: 'bed',          label: '주방',      icon: '🍳'  },
  { id: 'myFurniture',  label: '내 가구',   icon: '📷'  },
];

export const POPULAR_FURNITURE = ALL_FURNITURE.filter(f => !f.isMyFurniture && f.isWishlisted).slice(0, 4);

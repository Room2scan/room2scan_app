import { FurnitureItem, RoomProject, HeroBanner, CatalogCategory } from './types';

export const ALL_FURNITURE: FurnitureItem[] = [
  { id: 'f1', name: 'NORDLI Chest', type: 'Dresser', dimensions: '120×80 cm', price: '₩249,000', thumbnail: 'box', color: '#FFFFFF', isWishlisted: true, rating: 4.7 },
  { id: 'f2', name: 'EKERÖ Armchair', type: 'Chair', dimensions: '70×73 cm', price: '₩199,000', thumbnail: 'box', color: '#897FFF', isWishlisted: true, rating: 4.9 },
  { id: 'f3', name: 'LACK Table', type: 'Table', dimensions: '55×55 cm', price: '₩15,000', thumbnail: 'box', color: '#4A3AFF', isWishlisted: false, rating: 4.5 },
  { id: 'f4', name: 'KALLAX Shelf', type: 'Shelf', dimensions: '77×147 cm', price: '₩129,000', thumbnail: 'box', color: '#EAE8FF', isWishlisted: true, rating: 4.8 },
  { id: 'f5', name: 'MALM Bed Frame', type: 'Bed', dimensions: '160×200 cm', price: '₩349,000', thumbnail: 'box', color: '#D9DBE9', isWishlisted: false, rating: 4.6 },
  { id: 'f6', name: 'POÄNG Chair', type: 'Chair', dimensions: '68×82 cm', price: '₩179,000', thumbnail: 'box', color: '#897FFF', isWishlisted: false, rating: 4.4 },
  { id: 'f7', name: 'BILLY Bookcase', type: 'Shelf', dimensions: '80×202 cm', price: '₩89,000', thumbnail: 'box', color: '#F1F2F9', isWishlisted: true, rating: 4.8 },
  { id: 'f8', name: 'HEMNES Dresser', type: 'Dresser', dimensions: '108×96 cm', price: '₩299,000', thumbnail: 'box', color: '#EAE8FF', isWishlisted: false, rating: 4.7 },
  { id: 'f9', name: 'EKTORP Sofa', type: 'Sofa', dimensions: '235×88 cm', price: '₩599,000', thumbnail: 'box', color: '#D9DBE9', isWishlisted: true, rating: 4.9 },
  { id: 'f10', name: 'FRIHETEN Sofa', type: 'Sofa', dimensions: '230×151 cm', price: '₩699,000', thumbnail: 'box', color: '#897FFF', isWishlisted: false, rating: 4.6 },
  { id: 'mf1', name: '내 소파 (스캔)', type: 'Sofa', dimensions: '210×90 cm', price: '직접 스캔', thumbnail: 'box', color: '#4A3AFF', isWishlisted: false, rating: 5.0, isMyFurniture: true },
  { id: 'mf2', name: '원목 책상 (스캔)', type: 'Table', dimensions: '140×70 cm', price: '직접 스캔', thumbnail: 'box', color: '#897FFF', isWishlisted: false, rating: 5.0, isMyFurniture: true },
];

export const MY_ROOMS: RoomProject[] = [
  {
    id: 'r1', name: '안방', area: '12.4 m²', furnitureCount: 6, lastEdited: '2일 전',
    gradient: 'from-[#4A3AFF]/20 to-[#897FFF]/10', meshColor: '#897FFF', isFeatured: true,
    description: '아늑한 침실 공간. 침대와 수납장을 중심으로 편안하게 배치했어요.',
    heroImage: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80',
    realPhotos: [
      'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=400&q=75',
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400&q=75',
    ],
    furniture: [
      { id: 'rf1', name: 'MALM Bed Frame', thumbnail: 'box', dimensions: '160×200 cm', x: 20, y: 15, rotation: 0 },
      { id: 'rf2', name: 'NORDLI Chest', thumbnail: 'box', dimensions: '120×80 cm', x: 60, y: 20, rotation: 90 },
      { id: 'rf3', name: 'POÄNG Chair', thumbnail: 'box', dimensions: '68×82 cm', x: 55, y: 55, rotation: 45 },
    ],
  },
  {
    id: 'r2', name: '거실', area: '24.1 m²', furnitureCount: 9, lastEdited: '1주일 전',
    gradient: 'from-[#897FFF]/20 to-[#EAE8FF]/60', meshColor: '#4A3AFF', isFeatured: false,
    description: '넓고 트인 거실. 소파와 TV 장을 중심으로 동선을 최적화했습니다.',
    heroImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    realPhotos: [
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400&q=75',
      'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=400&q=75',
    ],
    furniture: [
      { id: 'rf4', name: 'EKTORP Sofa', thumbnail: 'box', dimensions: '235×88 cm', x: 25, y: 60, rotation: 0 },
      { id: 'rf5', name: 'LACK Table', thumbnail: 'box', dimensions: '55×55 cm', x: 50, y: 45, rotation: 0 },
      { id: 'rf6', name: 'BILLY Bookcase', thumbnail: 'box', dimensions: '80×202 cm', x: 10, y: 20, rotation: 0 },
    ],
  },
  {
    id: 'r3', name: '작업실', area: '8.2 m²', furnitureCount: 4, lastEdited: '3주일 전',
    gradient: 'from-[#EAE8FF] to-[#D9DBE9]/60', meshColor: '#A0A3BD', isFeatured: false,
    description: '집중할 수 있는 작업 공간. 책상과 선반으로 효율성을 높였습니다.',
    heroImage: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80',
    realPhotos: [
      'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=75',
      'https://images.unsplash.com/photo-1547119957-637f8679db1e?w=400&q=75',
    ],
    furniture: [
      { id: 'rf7', name: '원목 책상 (스캔)', thumbnail: 'box', dimensions: '140×70 cm', x: 30, y: 30, rotation: 0 },
      { id: 'rf8', name: 'KALLAX Shelf', thumbnail: 'box', dimensions: '77×147 cm', x: 70, y: 15, rotation: 0 },
    ],
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
  { id: 'wishlist', label: '찜한 목록', icon: 'heart' },
  { id: 'sofa', label: '소파', icon: 'home' },
  { id: 'bed', label: '침대', icon: 'moon' },
  { id: 'table', label: '테이블', icon: 'grid' },
  { id: 'shelf', label: '선반', icon: 'layers' },
  { id: 'chair', label: '의자', icon: 'box' },
  { id: 'myFurniture', label: '내 가구', icon: 'camera' },
];

export const POPULAR_FURNITURE = ALL_FURNITURE.filter(f => !f.isMyFurniture).slice(0, 4);

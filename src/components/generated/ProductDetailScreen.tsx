import React, { useState, Suspense, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, PerspectiveCamera, Float } from '@react-three/drei';
import type * as ThreeTypes from 'three';
import { ChevronLeft, Heart, Share2, Star, Ruler, Box, Package, RotateCw, CheckCircle2, ShoppingCart, Maximize2, ChevronRight } from 'lucide-react';
import { FurnitureItem } from './Scan2RoomTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductDetailScreenProps {
  item: FurnitureItem;
  isWishlisted: boolean;
  onBack: () => void;
  onToggleWishlist: (id: string) => void;
  onAddToRoom: (item: FurnitureItem) => void;
  onSnack: (msg: string, icon?: string) => void;
}
interface ProductSpec {
  label: string;
  value: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  Sofa: '#897FFF',
  Chair: '#4A3AFF',
  Bed: '#6B5EFF',
  Table: '#5448E0',
  Shelf: '#7B6FFF',
  Dresser: '#8E84FF'
};
const COLOR_OPTIONS = ['#F5F5F5', '#C4B9A0', '#4A3AFF', '#2D2D2D', '#D4C5B0'];
const REVIEW_DATA = [{
  id: 'rv1',
  author: '이재현',
  rating: 5,
  text: '배송 빠르고 조립도 쉬워요. 방에 딱 맞는 사이즈!'
}, {
  id: 'rv2',
  author: '김민지',
  rating: 4,
  text: '색감이 사진보다 더 예쁘네요. 추천합니다.'
}, {
  id: 'rv3',
  author: '박준서',
  rating: 5,
  text: '퀄리티 대비 가격이 합리적이에요.'
}];
const RECOMMENDED_ITEMS = [{
  id: 'rec1',
  name: 'LACK Table',
  thumb: '🧸',
  price: '₩15,000',
  color: '#4A3AFF'
}, {
  id: 'rec2',
  name: 'KALLAX Shelf',
  thumb: '📚',
  price: '₩129,000',
  color: '#EAE8FF'
}, {
  id: 'rec3',
  name: 'POÄNG Chair',
  thumb: '🪑',
  price: '₩179,000',
  color: '#897FFF'
}];
const DETAIL_TABS = [{
  id: 'specs' as const,
  label: '스펙'
}, {
  id: 'materials' as const,
  label: '소재'
}, {
  id: 'reviews' as const,
  label: '리뷰'
}];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getSpecsForItem = (item: FurnitureItem): ProductSpec[] => [{
  label: '크기',
  value: item.dimensions
}, {
  label: '유형',
  value: item.type
}, {
  label: '소재',
  value: item.type === 'Bed' ? '참나무 합판' : item.type === 'Sofa' ? '패브릭/스폰지' : '원목/MDF'
}, {
  label: '최대 하중',
  value: item.type === 'Shelf' ? '25 kg/선반' : item.type === 'Bed' ? '200 kg' : '150 kg'
}, {
  label: '조립 방식',
  value: '직접 조립 (공구 포함)'
}, {
  label: '보증 기간',
  value: '5년'
}];
const getMaterialsForItem = (item: FurnitureItem): string[] => {
  const base = ['친환경 인증 목재', '수성 도료'];
  if (item.type === 'Sofa') return ['고탄력 폼 쿠션', '패브릭 커버 (세탁 가능)', '단단한 나무 프레임'];
  if (item.type === 'Chair') return [...base, '통기성 패브릭', '인체공학 등받이'];
  if (item.type === 'Bed') return [...base, '슬랫 베이스', '철재 강화 프레임'];
  return base;
};

// ─── 3D Furniture Preview ─────────────────────────────────────────────────────

const LEG_POSITIONS: [number, number, number][] = [[0, 0, 0] // placeholder, computed dynamically
];
const FurniturePreview3D = ({
  color,
  type
}: {
  color: string;
  type: string;
}) => {
  const meshRef = useRef<ThreeTypes.Mesh>(null!);
  const getDims = (): [number, number, number] => {
    if (type === 'Sofa') return [2.4, 0.7, 1.0];
    if (type === 'Bed') return [2.0, 0.4, 1.8];
    if (type === 'Chair') return [0.7, 0.8, 0.7];
    if (type === 'Shelf') return [1.0, 2.0, 0.4];
    if (type === 'Table') return [1.2, 0.6, 0.8];
    return [1.2, 0.8, 1.0];
  };
  const dims = getDims();
  const resolvedColor = color === '#FFFFFF' || color === '#F5F5F5' ? '#f8f8f8' : color;
  const legPositions: [number, number, number][] = [[-dims[0] / 2 + 0.12, -dims[1] / 2 - 0.12, -dims[2] / 2 + 0.12], [dims[0] / 2 - 0.12, -dims[1] / 2 - 0.12, -dims[2] / 2 + 0.12], [-dims[0] / 2 + 0.12, -dims[1] / 2 - 0.12, dims[2] / 2 - 0.12], [dims[0] / 2 - 0.12, -dims[1] / 2 - 0.12, dims[2] / 2 - 0.12]];
  return <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -dims[1] / 2 - 0.01, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#EAE8FF" opacity={0.6} transparent />
      </mesh>

      <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.3}>
        <mesh ref={meshRef} castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={dims} />
          <meshStandardMaterial color={resolvedColor} roughness={0.35} metalness={0.08} />
        </mesh>

        {type !== 'Shelf' && type !== 'Bed' && legPositions.map((pos, i) => <mesh key={`leg-${i}`} position={pos} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 0.25, 8]} />
              <meshStandardMaterial color="#2D2D2D" roughness={0.5} />
            </mesh>)}
      </Float>

      <ContactShadows position={[0, -dims[1] / 2 - 0.01, 0]} opacity={0.45} scale={8} blur={2.5} far={0.8} />
    </group>;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ColorSwatch = ({
  color,
  selected,
  onClick
}: {
  color: string;
  selected: boolean;
  onClick: () => void;
}) => <motion.button whileTap={{
  scale: 0.88
}} onClick={onClick} className="rounded-full transition-all" style={{
  width: 28,
  height: 28,
  backgroundColor: color,
  border: selected ? '2.5px solid #4A3AFF' : '2px solid rgba(0,0,0,0.08)',
  boxShadow: selected ? '0 0 0 3px rgba(74,58,255,0.18)' : 'none'
}} />;
const SpecRow = ({
  label,
  value
}: {
  label: string;
  value: string;
}) => <div className="flex items-center justify-between py-3 border-b border-[#F1F2F9] last:border-0">
    <span className="text-[12px] text-[#A0A3BD] font-medium">{label}</span>
    <span className="text-[12px] font-semibold text-[#170F49]">{value}</span>
  </div>;
const RatingStars = ({
  rating
}: {
  rating: number;
}) => {
  const full = Math.floor(rating);
  const starIndices = [0, 1, 2, 3, 4];
  return <div className="flex items-center gap-0.5">
      {starIndices.map(i => <Star key={`star-${i}`} size={13} className={i < full ? 'text-amber-400 fill-amber-400' : 'text-[#D9DBE9] fill-[#D9DBE9]'} />)}
    </div>;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const ProductDetailScreen = ({
  item,
  isWishlisted,
  onBack,
  onToggleWishlist,
  onAddToRoom,
  onSnack
}: ProductDetailScreenProps) => {
  const [selectedColor, setSelectedColor] = useState(item.color);
  const [activeTab, setActiveTab] = useState<'specs' | 'materials' | 'reviews'>('specs');
  const [addedToRoom, setAddedToRoom] = useState(false);
  const [view3DActive, setView3DActive] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const accentColor = TYPE_COLORS[item.type] ?? '#4A3AFF';
  const specs = getSpecsForItem(item);
  const materials = getMaterialsForItem(item);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', onScroll, {
      passive: true
    });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);
  const PREVIEW_HEIGHT = 320;
  const headerSolid = scrollY > PREVIEW_HEIGHT * 0.55;
  const heroOpacity = Math.max(1 - scrollY / (PREVIEW_HEIGHT * 0.7), 0);
  const handleAddToRoom = () => {
    setAddedToRoom(true);
    onAddToRoom(item);
    onSnack(`${item.name} 방에 추가됨`, item.thumbnail);
    setTimeout(() => setAddedToRoom(false), 2200);
  };
  const VIEW_TOGGLE_OPTIONS = [{
    id: true as boolean,
    icon: Box,
    label: '3D'
  }, {
    id: false as boolean,
    icon: Maximize2,
    label: '2D'
  }];
  const RATING_BARS = [{
    stars: 5,
    width: '72%'
  }, {
    stars: 4,
    width: '20%'
  }, {
    stars: 3,
    width: '8%'
  }];
  return <motion.div initial={{
    opacity: 0,
    x: 40
  }} animate={{
    opacity: 1,
    x: 0
  }} exit={{
    opacity: 0,
    x: -20
  }} transition={{
    duration: 0.3,
    ease: [0.25, 0.1, 0.25, 1]
  }} className="absolute inset-0 bg-[#FBFBFE] flex flex-col overflow-hidden">
      {/* Floating header */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 pt-12 pb-3 transition-all duration-300" style={{
      background: headerSolid ? 'rgba(251,251,254,0.96)' : 'transparent',
      backdropFilter: headerSolid ? 'blur(16px)' : 'none'
    }}>
        <motion.button whileTap={{
        scale: 0.88
      }} onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center shadow-md border border-white/60 bg-white/90 backdrop-blur-sm">
          <ChevronLeft size={20} className="text-[#170F49]" />
        </motion.button>

        {headerSolid && <motion.div initial={{
        opacity: 0,
        y: -4
      }} animate={{
        opacity: 1,
        y: 0
      }} className="flex-1 text-center mx-3">
            <span className="text-[14px] font-bold text-[#170F49] truncate">
              {item.name}
            </span>
          </motion.div>}

        <div className="flex items-center gap-2">
          <motion.button whileTap={{
          scale: 0.88
        }} onClick={() => onSnack('링크가 복사되었어요', '🔗')} className="w-10 h-10 rounded-full flex items-center justify-center shadow-md border border-white/60 bg-white/90 backdrop-blur-sm">
            <Share2 size={15} className="text-[#170F49]" />
          </motion.button>
          <motion.button whileTap={{
          scale: 0.88
        }} onClick={() => onToggleWishlist(item.id)} className="w-10 h-10 rounded-full flex items-center justify-center shadow-md border border-white/60 bg-white/90 backdrop-blur-sm">
            <Heart size={15} className={isWishlisted ? 'text-red-500 fill-red-500' : 'text-[#170F49]'} />
          </motion.button>
        </div>
      </div>

      {/* Scrollable body */}
      <div ref={scrollRef} className="absolute inset-0 overflow-y-auto" style={{
      WebkitOverflowScrolling: 'touch'
    } as React.CSSProperties}>
        {/* 3D / Emoji preview area */}
        <div className="relative w-full flex-shrink-0" style={{
        height: `${PREVIEW_HEIGHT}px`
      }}>
          <div className="absolute inset-0" style={{
          background: `linear-gradient(145deg, ${accentColor}18 0%, ${accentColor}08 50%, #EAE8FF 100%)`
        }} />

          {/* View toggle */}
          <div className="absolute top-16 right-4 z-20 flex items-center p-0.5 rounded-[10px] gap-0.5" style={{
          backgroundColor: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.8)',
          opacity: heroOpacity
        }}>
            {VIEW_TOGGLE_OPTIONS.map(v => <motion.button key={v.label} whileTap={{
            scale: 0.9
          }} onClick={() => setView3DActive(v.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] transition-all" style={{
            backgroundColor: view3DActive === v.id ? accentColor : 'transparent'
          }}>
                <v.icon size={11} color={view3DActive === v.id ? '#fff' : '#A0A3BD'} />
                <span className="text-[10px] font-bold" style={{
              color: view3DActive === v.id ? '#fff' : '#A0A3BD'
            }}>
                  {v.label}
                </span>
              </motion.button>)}
          </div>

          <AnimatePresence mode="wait">
            {view3DActive ? <motion.div key="3d" initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} exit={{
            opacity: 0
          }} transition={{
            duration: 0.35
          }} className="absolute inset-0">
                <Suspense fallback={<div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl" style={{
                  backgroundColor: `${accentColor}20`
                }}>
                          <span>{item.thumbnail}</span>
                        </div>
                        <span className="text-[#A0A3BD] text-xs">3D 로딩 중...</span>
                      </div>
                    </div>}>
                  <Canvas shadows>
                    <PerspectiveCamera makeDefault position={[3, 2.5, 3.5]} fov={45} />
                    <OrbitControls enableDamping dampingFactor={0.06} minDistance={2} maxDistance={8} maxPolarAngle={Math.PI / 2.1} autoRotate autoRotateSpeed={0.8} />
                    <Environment preset="apartment" />
                    <ambientLight intensity={0.6} />
                    <spotLight position={[6, 8, 6]} angle={0.2} penumbra={1} castShadow intensity={0.9} />
                    <FurniturePreview3D color={selectedColor} type={item.type} />
                  </Canvas>
                </Suspense>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none" style={{
              opacity: heroOpacity * 0.8
            }}>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{
                backgroundColor: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(8px)'
              }}>
                    <RotateCw size={10} color="rgba(255,255,255,0.8)" />
                    <span className="text-white text-[10px] font-medium">드래그하여 회전</span>
                  </div>
                </div>
              </motion.div> : <motion.div key="2d" initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} exit={{
            opacity: 0
          }} transition={{
            duration: 0.35
          }} className="absolute inset-0 flex items-center justify-center">
                <div className="w-44 h-44 rounded-[32px] flex items-center justify-center text-8xl shadow-xl" style={{
              background: `linear-gradient(135deg, ${selectedColor}25, ${accentColor}12)`,
              border: `1.5px solid ${accentColor}20`
            }}>
                  <span>{item.thumbnail}</span>
                </div>
              </motion.div>}
          </AnimatePresence>

          {/* Bottom fade overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none" style={{
          background: 'linear-gradient(to top, #FBFBFE 0%, transparent 100%)'
        }} />
        </div>

        {/* Content area */}
        <div className="bg-[#FBFBFE] pb-44 px-5">
          {/* Product header */}
          <div className="pt-2 pb-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                  backgroundColor: `${accentColor}18`,
                  color: accentColor
                }}>
                    {item.type}
                  </span>
                  {item.isMyFurniture && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4A3AFF] text-white">
                      내 가구
                    </span>}
                </div>
                <h1 className="text-[22px] font-bold text-[#170F49] leading-snug">
                  <span>{item.name}</span>
                </h1>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[20px] font-bold" style={{
                color: accentColor
              }}>
                  <span>{item.price}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <RatingStars rating={item.rating} />
              <span className="text-[12px] font-bold text-[#170F49]">
                {item.rating.toFixed(1)}
              </span>
              <span className="text-[#D9DBE9]">·</span>
              <span className="text-[11px] text-[#A0A3BD]">
                리뷰 {Math.floor(item.rating * 12)}개
              </span>
            </div>
          </div>

          {/* Dimensions row */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-[16px] mb-5" style={{
          backgroundColor: `${accentColor}10`
        }}>
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{
            backgroundColor: accentColor
          }}>
              <Ruler size={15} color="white" />
            </div>
            <div>
              <p className="text-[11px] text-[#A0A3BD] font-medium">
                <span>제품 크기</span>
              </p>
              <p className="text-[13px] font-bold text-[#170F49]">
                <span>{item.dimensions}</span>
              </p>
            </div>
          </div>

          {/* Color selection */}
          {!item.isMyFurniture && <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[13px] font-bold text-[#170F49]">
                  <span>컬러 선택</span>
                </h2>
                <span className="text-[11px] text-[#A0A3BD]">
                  <span>5가지 색상</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                {COLOR_OPTIONS.map(c => <ColorSwatch key={c} color={c} selected={selectedColor === c} onClick={() => setSelectedColor(c)} />)}
              </div>
            </div>}

          <div className="h-px bg-[#F1F2F9] mb-5" />

          {/* Detail tabs */}
          <div className="mb-4">
            <div className="flex items-center gap-1 mb-4 p-1 rounded-[14px] bg-[#F1F2F9]">
              {DETAIL_TABS.map(tab => <motion.button key={tab.id} whileTap={{
              scale: 0.95
            }} onClick={() => setActiveTab(tab.id)} className="flex-1 py-2.5 rounded-[11px] transition-all" style={{
              backgroundColor: activeTab === tab.id ? '#fff' : 'transparent',
              boxShadow: activeTab === tab.id ? '0 1px 8px rgba(0,0,0,0.06)' : 'none'
            }}>
                  <span className="text-[12px] font-bold transition-colors" style={{
                color: activeTab === tab.id ? '#170F49' : '#A0A3BD'
              }}>
                    {tab.label}
                  </span>
                </motion.button>)}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'specs' && <motion.div key="specs" initial={{
              opacity: 0,
              y: 8
            }} animate={{
              opacity: 1,
              y: 0
            }} exit={{
              opacity: 0,
              y: -8
            }} transition={{
              duration: 0.22
            }}>
                  {specs.map(spec => <SpecRow key={spec.label} label={spec.label} value={spec.value} />)}
                </motion.div>}

              {activeTab === 'materials' && <motion.div key="materials" initial={{
              opacity: 0,
              y: 8
            }} animate={{
              opacity: 1,
              y: 0
            }} exit={{
              opacity: 0,
              y: -8
            }} transition={{
              duration: 0.22
            }} className="space-y-2.5">
                  {materials.map((mat, i) => <div key={`mat-${i}`} className="flex items-center gap-3 px-4 py-3 rounded-[14px] bg-white border border-[#F1F2F9]">
                      <div className="w-7 h-7 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{
                  backgroundColor: `${accentColor}15`
                }}>
                        <Package size={13} style={{
                    color: accentColor
                  }} />
                      </div>
                      <span className="text-[12px] font-semibold text-[#514F6E]">{mat}</span>
                    </div>)}
                </motion.div>}

              {activeTab === 'reviews' && <motion.div key="reviews" initial={{
              opacity: 0,
              y: 8
            }} animate={{
              opacity: 1,
              y: 0
            }} exit={{
              opacity: 0,
              y: -8
            }} transition={{
              duration: 0.22
            }} className="space-y-3">
                  {/* Aggregate rating card */}
                  <div className="flex items-center gap-4 px-4 py-4 rounded-[18px] mb-2" style={{
                backgroundColor: `${accentColor}08`,
                border: `1px solid ${accentColor}15`
              }}>
                    <div className="text-center">
                      <p className="text-4xl font-bold" style={{
                    color: accentColor
                  }}>
                        <span>{item.rating.toFixed(1)}</span>
                      </p>
                      <RatingStars rating={item.rating} />
                    </div>
                    <div className="flex-1 space-y-1">
                      {RATING_BARS.map(bar => <div key={`bar-${bar.stars}`} className="flex items-center gap-2">
                          <span className="text-[10px] text-[#A0A3BD] w-3">{bar.stars}</span>
                          <div className="flex-1 h-1.5 bg-[#EAE8FF] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{
                        width: bar.width,
                        backgroundColor: accentColor
                      }} />
                          </div>
                        </div>)}
                    </div>
                  </div>

                  {REVIEW_DATA.map(rv => <div key={rv.id} className="bg-white rounded-[18px] p-4 border border-[#F1F2F9]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{
                      background: `linear-gradient(135deg, ${accentColor}, #897FFF)`
                    }}>
                            <span>{rv.author[0]}</span>
                          </div>
                          <span className="text-[12px] font-bold text-[#170F49]">
                            {rv.author}
                          </span>
                        </div>
                        <RatingStars rating={rv.rating} />
                      </div>
                      <p className="text-[12px] text-[#514F6E] leading-relaxed">
                        <span>{rv.text}</span>
                      </p>
                    </div>)}
                </motion.div>}
            </AnimatePresence>
          </div>

          {/* Related products */}
          <div className="h-px bg-[#F1F2F9] my-5" />
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-bold text-[#170F49]">
                <span>어울리는 제품</span>
              </h2>
              <button className="flex items-center gap-0.5 text-[11px] font-semibold" style={{
              color: accentColor
            }}>
                <span>전체 보기</span>
                <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5">
              {RECOMMENDED_ITEMS.map(rec => <motion.div key={rec.id} whileTap={{
              scale: 0.96
            }} className="flex-shrink-0 w-28 rounded-[16px] p-3 bg-white border border-[#F1F2F9] shadow-sm cursor-pointer">
                  <div className="w-full aspect-square rounded-[10px] flex items-center justify-center text-2xl mb-2" style={{
                backgroundColor: `${rec.color}20`
              }}>
                    <span>{rec.thumb}</span>
                  </div>
                  <p className="text-[10px] font-bold text-[#170F49] truncate">
                    <span>{rec.name}</span>
                  </p>
                  <p className="text-[10px] font-bold mt-0.5" style={{
                color: accentColor
              }}>
                    <span>{rec.price}</span>
                  </p>
                </motion.div>)}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-5 pb-8 pt-5 pointer-events-none" style={{
      background: 'linear-gradient(to top, rgba(251,251,254,1) 65%, rgba(251,251,254,0) 100%)'
    }}>
        <div className="flex gap-3 pointer-events-auto">
          <motion.button whileTap={{
          scale: 0.94
        }} onClick={() => onToggleWishlist(item.id)} className="w-14 h-14 rounded-[18px] flex items-center justify-center flex-shrink-0 border border-[#EAE8FF] bg-white shadow-sm">
            <Heart size={20} className={isWishlisted ? 'text-red-500 fill-red-500' : 'text-[#A0A3BD]'} />
          </motion.button>

          <motion.button whileTap={{
          scale: 0.97
        }} onClick={handleAddToRoom} className="flex-1 h-14 rounded-[18px] flex items-center justify-center gap-2.5 shadow-xl overflow-hidden" style={{
          background: addedToRoom ? 'linear-gradient(135deg, #22c55e, #16a34a)' : `linear-gradient(135deg, ${accentColor} 0%, #897FFF 100%)`,
          boxShadow: addedToRoom ? '0 8px 24px rgba(34,197,94,0.35)' : `0 8px 24px ${accentColor}55`,
          transition: 'background 0.4s ease'
        }}>
            <AnimatePresence mode="wait">
              {addedToRoom ? <motion.div key="added" initial={{
              scale: 0.6,
              opacity: 0
            }} animate={{
              scale: 1,
              opacity: 1
            }} exit={{
              scale: 0.6,
              opacity: 0
            }} className="flex items-center gap-2">
                  <CheckCircle2 size={18} color="white" />
                  <span className="text-white font-bold text-[14px]">방에 추가됨!</span>
                </motion.div> : <motion.div key="idle" initial={{
              scale: 0.6,
              opacity: 0
            }} animate={{
              scale: 1,
              opacity: 1
            }} exit={{
              scale: 0.6,
              opacity: 0
            }} className="flex items-center gap-2">
                  <ShoppingCart size={18} color="white" />
                  <span className="text-white font-bold text-[14px]">방에 배치하기</span>
                </motion.div>}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.div>;
};
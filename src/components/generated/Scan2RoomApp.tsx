import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Box, Layers, RotateCcw, RotateCw, Plus, Check, X, ChevronLeft, ChevronRight, Settings, Trash2, Maximize2, Move, Info, Heart, Grid3x3, Copy, Share2, RotateCw as RotateIcon, MapPin, Clock, Star, type LucideIcon } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, PerspectiveCamera, Float, Html } from '@react-three/drei';
import { PanoramaCameraScreen } from './PanoramaCameraScreen';
import { ReconstructionScreen } from './ReconstructionScreen';

// ─── Screen components ────────────────────────────────────────────────────────
import { HomeScreen } from './HomeScreen';
import { MyRoomsScreen } from './MyRoomsScreen';
import { CatalogFlowContainer } from './CatalogFlowContainer';
import { SettingsScreen } from './SettingsScreen';

// ─── Shared ───────────────────────────────────────────────────────────────────
import { SnackbarContainer, GlassCard, IconButton } from './Scan2RoomShared';

// ─── Types & Data ─────────────────────────────────────────────────────────────
import { AppState, MainTab, ViewMode, RoomFurnitureItem, SnackbarItem, FurnitureItem } from './Scan2RoomTypes';
import { MY_ROOMS, ALL_FURNITURE } from './Scan2RoomData';

// ─── 3D Scene Helpers ─────────────────────────────────────────────────────────

const RoomMesh = () => <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="#EAE8FF" />
    </mesh>
    <mesh position={[0, 1, -5]} receiveShadow>
      <boxGeometry args={[10, 4, 0.2]} />
      <meshStandardMaterial color="#FFFFFF" />
    </mesh>
    <mesh position={[-5, 1, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
      <boxGeometry args={[10, 4, 0.2]} />
      <meshStandardMaterial color="#F1F2F9" />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.99, 0]}>
      <planeGeometry args={[10, 10, 10, 10]} />
      <meshStandardMaterial color="#D9DBE9" wireframe opacity={0.3} transparent />
    </mesh>
  </group>;
const EditableFurniture = ({
  position,
  color
}: {
  position: [number, number, number];
  color: string;
}) => {
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);
  return <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh position={position} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} onClick={() => setActive(!active)} castShadow>
        <boxGeometry args={[1.2, 0.8, 1.2]} />
        <meshStandardMaterial color={active ? '#4A3AFF' : hovered ? '#897FFF' : color} roughness={0.3} metalness={0.1} transparent opacity={0.9} />
        {active && <Html distanceFactor={5}>
            <div className="bg-white/90 backdrop-blur-sm border border-white px-2 py-1 rounded-md text-[10px] whitespace-nowrap shadow-md">
              <span>Selected: NORDLI</span>
            </div>
          </Html>}
      </mesh>
    </Float>;
};

// ─── ROOM DETAIL SCREEN ───────────────────────────────────────────────────────

const RoomDetailScreen = ({
  roomId,
  onBack,
  onOpenEditor,
  onScanFurniture,
  onSnack
}: {
  roomId: string;
  onBack: () => void;
  onOpenEditor: () => void;
  onScanFurniture: () => void;
  onSnack: (msg: string, icon?: string) => void;
}) => {
  const room = MY_ROOMS.find(r => r.id === roomId) ?? MY_ROOMS[0];
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const [roomFurniture, setRoomFurniture] = useState<RoomFurnitureItem[]>(room.furniture);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedItem = roomFurniture.find(f => f.id === selectedFurnitureId);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', onScroll, {
      passive: true
    });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    setRoomFurniture(room.furniture);
    setSelectedFurnitureId(null);
    setScrollY(0);
    setViewMode('2d');
  }, [roomId, room.furniture]);
  const HERO_HEIGHT = typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.48) : 340;
  const heroOpacity = Math.max(1 - scrollY / (HERO_HEIGHT * 0.6), 0);
  const headerBg = scrollY > HERO_HEIGHT * 0.5;
  const handleFurnitureLongPress = (id: string) => {
    longPressTimer.current = setTimeout(() => {
      setSelectedFurnitureId(id);
      setShowActionMenu(true);
    }, 600);
  };
  const handleFurniturePressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };
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
      y: Math.min(selectedItem.y + 5, 80)
    };
    setRoomFurniture(prev => [...prev, newItem]);
    setSelectedFurnitureId(null);
    setShowActionMenu(false);
    onSnack(`${selectedItem.name} 복제됨`, '✨');
  };
  const handleRotate = () => {
    if (!selectedFurnitureId) return;
    setRoomFurniture(prev => prev.map(f => f.id === selectedFurnitureId ? {
      ...f,
      rotation: (f.rotation + 45) % 360
    } : f));
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
      rotation: 0
    };
    setRoomFurniture(prev => [...prev, newItem]);
    setShowAddSheet(false);
    onSnack(`${item.name} 추가됨`, item.thumbnail);
  };
  const actionMenuItems = [{
    icon: Move,
    label: '이동',
    action: () => setShowActionMenu(false),
    color: '#4A3AFF'
  }, {
    icon: RotateIcon,
    label: '회전',
    action: () => {
      handleRotate();
      setShowActionMenu(false);
    },
    color: '#4A3AFF'
  }, {
    icon: Copy,
    label: '복제',
    action: handleDuplicate,
    color: '#514F6E'
  }, {
    icon: Trash2,
    label: '삭제',
    action: handleDelete,
    color: '#EF4444'
  }];
  return <motion.div initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} exit={{
    opacity: 0
  }} transition={{
    duration: 0.28
  }} className="absolute inset-0 bg-[#FBFBFE] flex flex-col overflow-hidden">
      {/* Floating top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 pt-12 pb-3 transition-all duration-300" style={{
      background: headerBg ? 'rgba(251,251,254,0.95)' : 'transparent',
      backdropFilter: headerBg ? 'blur(12px)' : 'none'
    }}>
        <motion.button whileTap={{
        scale: 0.9
      }} onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center shadow-md border border-white/60 bg-white/90 backdrop-blur-sm">
          <ChevronLeft size={20} className="text-[#170F49]" />
        </motion.button>
        {headerBg && <motion.div initial={{
        opacity: 0,
        y: -4
      }} animate={{
        opacity: 1,
        y: 0
      }} className="flex-1 text-center mx-3">
            <span className="text-[15px] font-bold text-[#170F49]">{room.name}</span>
          </motion.div>}
        <div className="flex items-center gap-2">
          <motion.button whileTap={{
          scale: 0.9
        }} onClick={() => onSnack('링크가 복사되었어요', '🔗')} className="w-10 h-10 rounded-full flex items-center justify-center shadow-md border border-white/60 bg-white/90 backdrop-blur-sm">
            <Share2 size={16} className="text-[#170F49]" />
          </motion.button>
          <motion.button whileTap={{
          scale: 0.9
        }} onClick={() => setIsWishlisted(w => !w)} className="w-10 h-10 rounded-full flex items-center justify-center shadow-md border border-white/60 bg-white/90 backdrop-blur-sm">
            <Heart size={16} className={isWishlisted ? 'text-red-500 fill-red-500' : 'text-[#170F49]'} />
          </motion.button>
        </div>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="absolute inset-0 overflow-y-auto" style={{
      WebkitOverflowScrolling: 'touch'
    } as React.CSSProperties}>
        {/* Hero */}
        <div className="relative" style={{
        height: `${HERO_HEIGHT}px`
      }}>
          <AnimatePresence mode="wait">
            {viewMode === '2d' ? <motion.div key="hero-2d" initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} exit={{
            opacity: 0
          }} transition={{
            duration: 0.4
          }} className="absolute inset-0">
                <img src={room.heroImage} alt={`${room.name} 뷰`} className="w-full h-full object-cover" style={{
              transform: `translateY(${scrollY * 0.25}px) scale(1.1)`,
              transformOrigin: 'center top'
            }} />
                <div className="absolute inset-0" style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 40%, rgba(0,0,0,0.0) 70%, rgba(251,251,254,1) 100%)'
            }} />
              </motion.div> : <motion.div key="hero-3d" initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} exit={{
            opacity: 0
          }} transition={{
            duration: 0.4
          }} className="absolute inset-0 bg-[#EAE8FF]">
                <Suspense fallback={<div className="flex items-center justify-center h-full text-[#514F6E] text-sm">
                      <span>Loading 3D...</span>
                    </div>}>
                  <Canvas shadows>
                    <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
                    <OrbitControls enableDamping dampingFactor={0.05} minDistance={2} maxDistance={15} maxPolarAngle={Math.PI / 2.1} autoRotate autoRotateSpeed={0.6} />
                    <Environment preset="city" />
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} castShadow />
                    <RoomMesh />
                    <EditableFurniture position={[0, -0.6, 0]} color="#FFFFFF" />
                    <EditableFurniture position={[1.5, -0.6, -1]} color="#897FFF" />
                    <ContactShadows position={[0, -0.99, 0]} opacity={0.4} scale={10} blur={2.4} far={0.8} />
                  </Canvas>
                </Suspense>
                <div className="absolute bottom-16 left-0 right-0 flex justify-center pointer-events-none" style={{
              opacity: heroOpacity
            }}>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{
                backgroundColor: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(8px)'
              }}>
                    <span className="text-white text-[11px] font-medium">드래그하여 회전</span>
                  </div>
                </div>
              </motion.div>}
          </AnimatePresence>

          {viewMode === '2d' && <div className="absolute bottom-16 right-4 px-2.5 py-1 rounded-[8px]" style={{
          backgroundColor: 'rgba(10,8,20,0.6)',
          backdropFilter: 'blur(8px)'
        }}>
              <span className="text-white text-[11px] font-bold">
                1 / {1 + room.realPhotos.length}
              </span>
            </div>}

          <div className="absolute bottom-16 left-4" style={{
          opacity: heroOpacity,
          pointerEvents: heroOpacity > 0.2 ? 'auto' : 'none'
        }}>
            <div className="flex items-center p-1 rounded-[14px] gap-0.5" style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
              {(['2d', '3d'] as ViewMode[]).map(mode => <motion.button key={mode} whileTap={{
              scale: 0.93
            }} onClick={() => setViewMode(mode)} className="px-3 py-1.5 rounded-[10px] transition-all duration-200" style={{
              backgroundColor: viewMode === mode ? 'rgba(255,255,255,0.9)' : 'transparent'
            }}>
                  <span className="text-[12px] font-bold" style={{
                color: viewMode === mode ? '#170F49' : 'rgba(255,255,255,0.6)'
              }}>
                    {mode.toUpperCase()}
                  </span>
                </motion.button>)}
            </div>
          </div>
        </div>

        {/* Info Sheet */}
        <div className="relative bg-[#FBFBFE] rounded-t-[28px] -mt-6 pb-40" style={{
        boxShadow: '0 -2px 20px rgba(0,0,0,0.06)'
      }}>
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-[#D9DBE9]" />
          </div>

          <div className="px-5 pt-3 pb-5">
            <h1 className="text-2xl font-bold text-[#170F49] leading-tight mb-1">
              <span>{room.name}</span>
            </h1>
            <div className="flex items-center gap-1.5 mb-3">
              <MapPin size={12} className="text-[#A0A3BD]" />
              <span className="text-[13px] text-[#514F6E]">{room.area}</span>
              <span className="text-[#D9DBE9]">·</span>
              <Box size={12} className="text-[#A0A3BD]" />
              <span className="text-[13px] text-[#514F6E]">가구 {roomFurniture.length}개</span>
              <span className="text-[#D9DBE9]">·</span>
              <Clock size={12} className="text-[#A0A3BD]" />
              <span className="text-[13px] text-[#514F6E]">{room.lastEdited} 수정</span>
            </div>
            <p className="text-[13px] text-[#514F6E] leading-relaxed">
              <span>{room.description}</span>
            </p>
          </div>

          <div className="mx-5 h-px bg-[#F1F2F9] mb-5" />

          <div className="flex items-center mx-5 mb-5">
            <div className="flex-1 text-center">
              <p className="text-xl font-bold text-[#170F49]">
                <span>{room.area}</span>
              </p>
              <p className="text-[11px] text-[#A0A3BD] mt-0.5">
                <span>총 면적</span>
              </p>
            </div>
            <div className="w-px h-10 bg-[#F1F2F9]" />
            <div className="flex-1 flex flex-col items-center">
              <div className="flex items-center gap-1">
                <Box size={16} className="text-[#4A3AFF]" />
                <p className="text-xl font-bold text-[#170F49]">
                  <span>3D</span>
                </p>
              </div>
              <p className="text-[11px] text-[#A0A3BD] mt-0.5">
                <span>재구성 완료</span>
              </p>
            </div>
            <div className="w-px h-10 bg-[#F1F2F9]" />
            <div className="flex-1 text-center">
              <p className="text-xl font-bold text-[#170F49]">
                <span>{roomFurniture.length}</span>
              </p>
              <p className="text-[11px] text-[#A0A3BD] mt-0.5">
                <span>배치된 가구</span>
              </p>
            </div>
          </div>

          <div className="mx-5 h-px bg-[#F1F2F9] mb-5" />

          <div className="mx-5 mb-5 flex items-center gap-3 px-4 py-3 rounded-[16px] bg-[#F1F2F9]">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-[#4A3AFF] to-[#897FFF] flex-shrink-0">
              <Box size={16} className="text-white" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#170F49]">
                <span>3D 재구성 완료</span>
              </p>
              <p className="text-[11px] text-[#A0A3BD]">
                <span>AI가 실제 공간을 3D로 변환했어요</span>
              </p>
            </div>
          </div>

          <div className="mx-5 h-px bg-[#F1F2F9] mb-5" />

          {viewMode === '2d' && <div className="px-5 mb-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-bold text-[#170F49]">
                  <span>평면도 뷰</span>
                </h2>
                <span className="text-[11px] text-[#A0A3BD] font-medium">
                  <span>탭하여 가구 선택</span>
                </span>
              </div>
              <div className="rounded-[20px] overflow-hidden border border-[#EAE8FF]" style={{
            height: '200px'
          }}>
                <div className="w-full h-full relative bg-white">
                  <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(#EAE8FF 1px, transparent 1px), linear-gradient(90deg, #EAE8FF 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }} />
                  <div className="absolute inset-4 border-2 border-[#4A3AFF]/20 rounded-[8px]" />
                  {roomFurniture.map(item => <motion.button key={item.id} onMouseDown={() => handleFurnitureLongPress(item.id)} onMouseUp={handleFurniturePressEnd} onTouchStart={() => handleFurnitureLongPress(item.id)} onTouchEnd={handleFurniturePressEnd} onClick={() => handleFurnitureTap(item.id)} whileTap={{
                scale: 0.9
              }} className={`absolute w-11 h-11 rounded-[10px] flex items-center justify-center text-lg transition-all shadow-sm ${selectedFurnitureId === item.id ? 'border-2 border-[#4A3AFF] bg-[#EAE8FF] shadow-lg shadow-indigo-200' : 'border border-[#D9DBE9] bg-white'}`} style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`
              }}>
                      <span>{item.thumbnail}</span>
                    </motion.button>)}
                </div>
              </div>
            </div>}

          <div className="mx-5 h-px bg-[#F1F2F9] mb-5" />

          <div className="px-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-[#170F49]">
                <span>배치된 가구</span>
              </h2>
              <motion.button whileTap={{
              scale: 0.95
            }} onClick={() => setShowAddSheet(true)} className="flex items-center gap-1.5 text-[#4A3AFF] text-xs font-semibold">
                <Plus size={14} />
                <span>추가</span>
              </motion.button>
            </div>
            <div className="space-y-2.5">
              {roomFurniture.map(item => <motion.div key={item.id} layout whileTap={{
              scale: 0.98
            }} onClick={() => handleFurnitureTap(item.id)} className={`flex items-center gap-3 p-3.5 rounded-[18px] border transition-all cursor-pointer ${selectedFurnitureId === item.id ? 'bg-[#EAE8FF] border-[#4A3AFF]/30' : 'bg-white border-[#F1F2F9]'}`}>
                  <div className="w-11 h-11 rounded-[12px] flex items-center justify-center text-xl flex-shrink-0 bg-[#F1F2F9]">
                    <span>{item.thumbnail}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold truncate text-[#170F49]">
                      <span>{item.name}</span>
                    </p>
                    <p className="text-[11px] mt-0.5 text-[#A0A3BD]">
                      <span>{item.dimensions}</span>
                    </p>
                  </div>
                  {selectedFurnitureId === item.id && <div className="flex items-center gap-1.5 flex-shrink-0">
                      <motion.button whileTap={{
                  scale: 0.8
                }} onClick={e => {
                  e.stopPropagation();
                  handleRotate();
                }} className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm border bg-white border-[#EAE8FF]">
                        <RotateIcon size={14} className="text-[#4A3AFF]" />
                      </motion.button>
                      <motion.button whileTap={{
                  scale: 0.8
                }} onClick={e => {
                  e.stopPropagation();
                  handleDuplicate();
                }} className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm border bg-white border-[#EAE8FF]">
                        <Copy size={14} className="text-[#514F6E]" />
                      </motion.button>
                      <motion.button whileTap={{
                  scale: 0.8
                }} onClick={e => {
                  e.stopPropagation();
                  handleDelete();
                }} className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
                        <Trash2 size={14} className="text-red-400" />
                      </motion.button>
                    </div>}
                </motion.div>)}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none" style={{
      background: 'linear-gradient(to top, rgba(251,251,254,1) 70%, rgba(251,251,254,0) 100%)',
      paddingBottom: '28px',
      paddingTop: '24px',
      paddingLeft: '20px',
      paddingRight: '20px'
    }}>
        <motion.button whileTap={{
        scale: 0.97
      }} onClick={onOpenEditor} className="w-full pointer-events-auto rounded-[22px] overflow-hidden" style={{
        background: 'linear-gradient(135deg, #4A3AFF 0%, #6B5EFF 50%, #897FFF 100%)',
        boxShadow: '0 10px 32px rgba(74,58,255,0.38)'
      }}>
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[14px] bg-white/15 flex items-center justify-center">
                <Box size={20} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-[15px] leading-tight">
                  <span>지금 배치해보기</span>
                </p>
                <p className="text-white/65 text-[11px]">
                  <span>3D 에디터로 가구를 자유롭게 배치하세요</span>
                </p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
              <ChevronRight size={18} className="text-white" />
            </div>
          </div>
        </motion.button>
      </div>

      {/* Long-press Action Menu */}
      <AnimatePresence>
        {showActionMenu && selectedItem && <div>
            <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }} className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowActionMenu(false)} />
            <motion.div initial={{
          y: '100%'
        }} animate={{
          y: 0
        }} exit={{
          y: '100%'
        }} transition={{
          type: 'spring',
          damping: 28,
          stiffness: 250
        }} className="absolute bottom-0 left-0 right-0 rounded-t-[32px] z-50 p-6 shadow-2xl bg-white">
              <div className="w-12 h-1.5 rounded-full mx-auto mb-5 bg-[#EAE8FF]" />
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#F1F2F9]">
                <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl bg-[#F1F2F9]">
                  <span>{selectedItem.thumbnail}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#170F49]">
                    <span>{selectedItem.name}</span>
                  </p>
                  <p className="text-[11px] text-[#A0A3BD]">
                    <span>{selectedItem.dimensions}</span>
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {actionMenuItems.map(action => <motion.button key={action.label} whileTap={{
              scale: 0.9
            }} onClick={action.action} className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-[18px] flex items-center justify-center bg-[#F1F2F9]">
                      <action.icon size={22} style={{
                  color: action.color
                }} />
                    </div>
                    <span className="text-[11px] font-semibold text-[#514F6E]">{action.label}</span>
                  </motion.button>)}
              </div>
            </motion.div>
          </div>}
      </AnimatePresence>

      {/* Add Furniture Sheet */}
      <AnimatePresence>
        {showAddSheet && <div>
            <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }} className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowAddSheet(false)} />
            <motion.div initial={{
          y: '100%'
        }} animate={{
          y: 0
        }} exit={{
          y: '100%'
        }} transition={{
          type: 'spring',
          damping: 25,
          stiffness: 220
        }} className="absolute bottom-0 left-0 right-0 h-[68%] rounded-t-[36px] z-50 flex flex-col shadow-2xl bg-white">
              <div className="px-6 pt-5 pb-3 flex-shrink-0">
                <div className="w-12 h-1.5 rounded-full mx-auto mb-5 bg-[#EAE8FF]" />
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-bold text-[#170F49]">
                    <span>가구 추가</span>
                  </h3>
                  <motion.button whileTap={{
                scale: 0.9
              }} onClick={() => setShowAddSheet(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F1F2F9]">
                    <X size={16} className="text-[#514F6E]" />
                  </motion.button>
                </div>
                <p className="text-xs mb-3 text-[#A0A3BD]">
                  <span>카탈로그에서 선택하거나 카메라로 직접 스캔하세요</span>
                </p>
                <motion.button whileTap={{
              scale: 0.97
            }} onClick={() => {
              setShowAddSheet(false);
              onScanFurniture();
            }} className="w-full bg-gradient-to-r from-[#4A3AFF] to-[#897FFF] text-white rounded-[16px] py-3.5 flex items-center justify-center gap-2.5 shadow-md shadow-indigo-300/30 mb-3">
                  <Camera size={18} />
                  <span className="font-bold text-sm">카메라로 가구 스캔하기</span>
                </motion.button>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-px bg-[#EAE8FF]" />
                  <span className="text-[11px] font-semibold text-[#A0A3BD]">또는 카탈로그에서 선택</span>
                  <div className="flex-1 h-px bg-[#EAE8FF]" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 pb-8">
                <div className="grid grid-cols-2 gap-3">
                  {ALL_FURNITURE.map(item => <motion.div key={item.id} whileTap={{
                scale: 0.97
              }} onClick={() => addFurnitureToRoom(item)} className="rounded-[20px] p-4 flex flex-col gap-3 cursor-pointer bg-[#F1F2F9]">
                      <div className="w-full aspect-square rounded-[12px] flex items-center justify-center text-3xl shadow-sm bg-white">
                        <span>{item.thumbnail}</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold truncate text-[#170F49]">
                          <span>{item.name}</span>
                        </p>
                        <p className="text-[10px] text-[#A0A3BD]">
                          <span>{item.dimensions}</span>
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#4A3AFF]">{item.price}</span>
                        <div className="w-6 h-6 bg-[#4A3AFF] rounded-full flex items-center justify-center">
                          <Plus size={12} className="text-white" />
                        </div>
                      </div>
                    </motion.div>)}
                </div>
              </div>
            </motion.div>
          </div>}
      </AnimatePresence>
    </motion.div>;
};

// ─── EDITOR SCREEN ────────────────────────────────────────────────────────────

const EditorScreen = ({
  onBack
}: {
  onBack: () => void;
}) => {
  const [selectedFurniture, setSelectedFurniture] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  return <motion.div key="editor" initial={{
    opacity: 0,
    scale: 0.95
  }} animate={{
    opacity: 1,
    scale: 1
  }} exit={{
    opacity: 0
  }} className="absolute inset-0">
      <div className="absolute inset-0 bg-[#F1F2F9]">
        <Suspense fallback={<div className="flex items-center justify-center h-full text-[#514F6E] text-sm">
              <span>Loading Engine...</span>
            </div>}>
          <Canvas shadows>
            <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
            <OrbitControls enableDamping dampingFactor={0.05} minDistance={2} maxDistance={15} maxPolarAngle={Math.PI / 2.1} />
            <Environment preset="city" />
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} castShadow />
            <RoomMesh />
            <EditableFurniture position={[0, -0.6, 0]} color="#FFFFFF" />
            <EditableFurniture position={[1.5, -0.6, -1]} color="#897FFF" />
            <ContactShadows position={[0, -0.99, 0]} opacity={0.4} scale={10} blur={2.4} far={0.8} />
          </Canvas>
        </Suspense>
      </div>

      <div className="absolute top-12 left-0 right-0 px-6 flex justify-between items-center pointer-events-none">
        <motion.div initial={{
        y: -20
      }} animate={{
        y: 0
      }} className="pointer-events-auto">
          <IconButton icon={ChevronLeft} onClick={onBack} />
        </motion.div>
        <GlassCard className="px-6 py-3 pointer-events-auto flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#A0A3BD] font-bold uppercase tracking-wider">Project</span>
            <span className="text-sm font-bold text-[#170F49]">My Bedroom v1</span>
          </div>
          <div className="w-[1px] h-6 bg-gray-200 mx-1" />
          <button className="text-[#4A3AFF] p-1">
            <Info size={18} />
          </button>
        </GlassCard>
        <motion.div initial={{
        y: -20
      }} animate={{
        y: 0
      }} className="pointer-events-auto flex gap-2">
          <IconButton icon={RotateCcw} />
          <IconButton icon={RotateCw} />
        </motion.div>
      </div>

      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4">
        <IconButton icon={Maximize2} />
        <IconButton icon={Layers} />
        <IconButton icon={Move} active />
        <IconButton icon={Trash2} />
      </div>

      <div className="absolute bottom-10 left-0 right-0 px-6 flex flex-col gap-6 pointer-events-none">
        <AnimatePresence>
          {selectedFurniture && <motion.div initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: 10
        }} className="self-center bg-red-500/90 text-white px-4 py-2 rounded-full text-xs font-medium backdrop-blur-md flex items-center gap-2 shadow-lg">
              <X size={14} />
              <span>Collision Detected</span>
            </motion.div>}
        </AnimatePresence>
        <div className="flex justify-between items-end pointer-events-auto">
          <GlassCard className="p-2">
            <motion.button whileTap={{
            scale: 0.95
          }} className="bg-[#4A3AFF] text-white p-4 rounded-[18px] shadow-lg shadow-indigo-200 flex items-center gap-2" onClick={() => setShowCatalog(true)}>
              <Plus size={20} />
              <span className="text-sm font-semibold pr-2">가구 추가</span>
            </motion.button>
          </GlassCard>
          <GlassCard className="p-4 flex flex-col items-center">
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1 opacity-40">
                <Grid3x3 size={22} />
                <span className="text-[10px]">2D</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-[#4A3AFF]">
                <Box size={22} />
                <span className="text-[10px]">3D</span>
              </div>
            </div>
          </GlassCard>
          <motion.button whileTap={{
          scale: 0.9
        }} onClick={onBack} className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl border border-white/50 text-[#170F49]">
            <Check size={28} />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showCatalog && <div>
            <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }} className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setShowCatalog(false)} />
            <motion.div initial={{
          y: '100%'
        }} animate={{
          y: 0
        }} exit={{
          y: '100%'
        }} transition={{
          type: 'spring',
          damping: 25,
          stiffness: 200
        }} className="absolute bottom-0 left-0 right-0 h-[60%] bg-white rounded-t-[40px] z-50 p-8 shadow-2xl">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-[#170F49]">
                  <span>가구 카탈로그</span>
                </h3>
                <button onClick={() => setShowCatalog(false)} className="text-[#A0A3BD]">
                  <X size={24} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 h-[calc(100%-100px)] overflow-y-auto pr-2 pb-12">
                {ALL_FURNITURE.map(item => <motion.div key={item.id} whileTap={{
              scale: 0.98
            }} className="bg-[#F1F2F9] rounded-3xl p-4 flex flex-col gap-3 cursor-pointer border-2 border-transparent active:border-[#4A3AFF]" onClick={() => {
              setSelectedFurniture(item.id);
              setShowCatalog(false);
            }}>
                    <div className="aspect-square bg-white rounded-2xl flex items-center justify-center text-4xl shadow-sm">
                      <span>{item.thumbnail}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#170F49] truncate">
                        <span>{item.name}</span>
                      </p>
                      <p className="text-[10px] text-[#514F6E]">
                        <span>{item.dimensions}</span>
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-auto">
                      <span className="text-xs font-bold text-[#4A3AFF]">{item.price}</span>
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <Plus size={14} className="text-[#4A3AFF]" />
                      </div>
                    </div>
                  </motion.div>)}
              </div>
            </motion.div>
          </div>}
      </AnimatePresence>
    </motion.div>;
};

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

export const Scan2RoomApp = () => {
  const [appState, setAppState] = useState<AppState>('home');
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('r1');
  const [cameraMode, setCameraMode] = useState<'room' | 'furniture'>('room');
  const [snacks, setSnacks] = useState<SnackbarItem[]>([]);
  const addSnack = useCallback((message: string, icon?: string) => {
    const id = `snack_${Date.now()}_${Math.random()}`;
    setSnacks(prev => [...prev.slice(-2), {
      id,
      message,
      icon
    }]);
    setTimeout(() => {
      setSnacks(prev => prev.filter(s => s.id !== id));
    }, 2800);
  }, []);
  const goHome = () => {
    setAppState('home');
    setActiveTab('home');
  };
  const goCamera = (mode: 'room' | 'furniture' = 'room') => {
    setCameraMode(mode);
    setAppState('camera');
  };
  const goProcess = () => setAppState('processing');
  const goEditor = () => setAppState('editor');
  const goRoomDetail = (id: string) => {
    setSelectedRoomId(id);
    setAppState('roomDetail');
  };
  return <div className="relative w-full h-screen font-sans overflow-hidden select-none bg-[#FBFBFE]">
      <AnimatePresence mode="wait">
        {appState === 'home' && activeTab === 'home' && <HomeScreen key="home" onAddRoom={() => goCamera('room')} onOpenRoom={goRoomDetail} onTabChange={tab => {
        setActiveTab(tab);
        if (tab !== 'home') setAppState('home');
      }} onSnack={addSnack} />}

        {appState === 'home' && activeTab === 'rooms' && <MyRoomsScreen key="myrooms" onOpenRoom={goRoomDetail} onAddRoom={() => goCamera('room')} onTabChange={tab => setActiveTab(tab)} />}

        {appState === 'home' && activeTab === 'catalog' && <CatalogFlowContainer key="catalog" onAddMyFurniture={() => goCamera('furniture')} onTabChange={tab => setActiveTab(tab)} onSnack={addSnack} />}

        {appState === 'home' && activeTab === 'settings' && <SettingsScreen key="settings" onTabChange={tab => setActiveTab(tab)} />}

        {appState === 'camera' && <PanoramaCameraScreen key="camera" mode={cameraMode} onProcess={goProcess} onBack={() => {
        if (cameraMode === 'furniture') {
          setAppState('home');
          setActiveTab('catalog');
        } else goHome();
      }} />}

        {appState === 'processing' && <ReconstructionScreen key="processing" onComplete={() => {
        if (cameraMode === 'furniture') {
          setAppState('home');
          setActiveTab('catalog');
        } else goEditor();
      }} />}

        {appState === 'editor' && <EditorScreen key="editor" onBack={goHome} />}

        {appState === 'roomDetail' && <RoomDetailScreen key={`roomdetail-${selectedRoomId}`} roomId={selectedRoomId} onBack={() => {
        setAppState('home');
        setActiveTab('rooms');
      }} onOpenEditor={goEditor} onScanFurniture={() => goCamera('furniture')} onSnack={addSnack} />}
      </AnimatePresence>

      <SnackbarContainer snacks={snacks} onDismiss={id => setSnacks(prev => prev.filter(s => s.id !== id))} />

      <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none opacity-10 z-[1]">
        <span className="text-[8px] uppercase tracking-[4px] font-bold text-[#170F49]">
          Scan2Room v1.0
        </span>
      </div>
    </div>;
};
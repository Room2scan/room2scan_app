import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bell, Search, ChevronRight, Plus, Flame, Star } from 'lucide-react';
import { MainTab } from './Scan2RoomTypes';
import { HERO_BANNERS, MY_ROOMS, POPULAR_FURNITURE } from './Scan2RoomData';
import { BottomNav, tabTransition } from './Scan2RoomShared';
interface HomeScreenProps {
  onAddRoom: () => void;
  onOpenRoom: (roomId: string) => void;
  onTabChange: (t: MainTab) => void;
  onSnack: (msg: string, icon?: string) => void;
}
export const HomeScreen = ({
  onAddRoom,
  onOpenRoom,
  onTabChange,
  onSnack
}: HomeScreenProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const BANNER_HEIGHT = typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.52) : 360;
  const SHEET_OVERLAP = 28;
  const MIN_BANNER = 72;
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
    const t = setInterval(() => setActiveBanner(prev => (prev + 1) % HERO_BANNERS.length), 5500);
    return () => clearInterval(t);
  }, []);
  const bannerProgress = Math.min(scrollY / (BANNER_HEIGHT - MIN_BANNER - SHEET_OVERLAP), 1);
  const bannerHeight = Math.max(BANNER_HEIGHT - scrollY, MIN_BANNER + SHEET_OVERLAP);
  const bannerOpacity = Math.max(1 - bannerProgress * 1.6, 0);
  const bannerScale = 1 - bannerProgress * 0.03;
  const sheetBorderRadius = 28 - bannerProgress * 28;
  const activeBannerData = HERO_BANNERS[activeBanner];
  return <motion.div {...tabTransition} className="absolute inset-0 bg-[#FBFBFE] flex flex-col overflow-hidden">
      {/* Fixed top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-12 pb-3 px-5 flex items-center justify-between pointer-events-none" style={{
      background: bannerProgress < 0.6 ? 'transparent' : `rgba(251,251,254,${(bannerProgress - 0.6) * 2.5})`
    }}>
        <div style={{
        opacity: Math.max(bannerProgress * 2 - 0.5, 0)
      }}>
          <h1 className="text-lg font-bold text-[#170F49]">
            <span>Feed</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <motion.button whileTap={{
          scale: 0.9
        }} className="w-9 h-9 rounded-full flex items-center justify-center shadow-md border bg-white border-[#F1F2F9]">
            <Bell size={16} className="text-[#514F6E]" />
          </motion.button>
          <div className="w-9 h-9 bg-gradient-to-br from-[#4A3AFF] to-[#897FFF] rounded-full flex items-center justify-center shadow-md shadow-indigo-200">
            <span className="text-white text-xs font-bold">박</span>
          </div>
        </div>
      </div>

      {/* Hero banner */}
      <div className="absolute top-0 left-0 right-0 overflow-hidden" style={{
      height: `${bannerHeight}px`,
      transform: `scale(${bannerScale})`,
      transformOrigin: 'top center'
    }}>
        {HERO_BANNERS.map((banner, idx) => <div key={banner.id} className="absolute inset-0 transition-opacity" style={{
        opacity: idx === activeBanner ? 1 : 0,
        transitionDuration: '1200ms',
        transitionTimingFunction: 'ease-in-out'
      }}>
            <img src={banner.imageUrl} alt={banner.headline} className="w-full h-full object-cover" style={{
          transform: `translateY(${scrollY * 0.3}px)`
        }} />
            <div className="absolute inset-0" style={{
          background: `linear-gradient(to bottom, ${banner.overlayFrom} 0%, ${banner.overlayTo} 60%, rgba(0,0,0,0.55) 100%)`
        }} />
          </div>)}

        <div className="absolute top-14 left-5 z-10 flex items-center gap-2" style={{
        opacity: bannerOpacity
      }}>
          <span className="text-white font-bold text-[15px] tracking-tight" style={{
          textShadow: '0 1px 6px rgba(0,0,0,0.3)'
        }}>
            Scan2Room
          </span>
        </div>

        <div className="absolute bottom-14 left-0 right-0 px-5" style={{
        opacity: bannerOpacity,
        transform: `translateY(${bannerProgress * 16}px)`,
        height: '280px'
      }}>
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="text-white text-[10px] font-bold tracking-wide uppercase">
              {activeBannerData.label}
            </span>
          </div>
          <h2 className="text-white text-2xl font-bold leading-tight mb-1.5">
            <span>{activeBannerData.headline}</span>
          </h2>
          <p className="text-white/80 text-xs leading-relaxed max-w-[280px]">
            <span>{activeBannerData.subtext}</span>
          </p>
        </div>

        <div className="absolute bottom-4 right-5 flex items-center gap-1.5" style={{
        opacity: bannerOpacity,
        height: '70px'
      }}>
          {HERO_BANNERS.map((b, i) => <button key={b.id} onClick={() => setActiveBanner(i)} className={`rounded-full transition-all duration-300 ${i === activeBanner ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`} />)}
        </div>
      </div>

      {/* Scrollable content sheet */}
      <div ref={scrollRef} className="absolute inset-0 overflow-y-auto" style={{
      WebkitOverflowScrolling: 'touch'
    } as React.CSSProperties}>
        <div style={{
        height: `${BANNER_HEIGHT - SHEET_OVERLAP}px`,
        display: 'block'
      }} />
        <div className="relative min-h-screen pb-36 bg-[#FBFBFE]" style={{
        borderTopLeftRadius: `${sheetBorderRadius}px`,
        borderTopRightRadius: `${sheetBorderRadius}px`,
        boxShadow: '0 -4px 24px rgba(0,0,0,0.08)'
      }}>
          {/* Search */}
          <div className="px-5 pt-5 pb-5">
            <div className="flex items-center gap-3 border border-[#EAE8FF] rounded-[16px] px-4 py-3 shadow-sm bg-white">
              <Search size={15} className="text-[#A0A3BD] flex-shrink-0" />
              <input type="text" placeholder="가구 또는 방 검색..." className="flex-1 text-sm bg-transparent outline-none text-[#170F49]" />
            </div>
          </div>

          {/* My Rooms row */}
          <section className="px-5 mb-7">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-bold text-[#170F49]">
                <span>내 방 목록</span>
              </h2>
              <button onClick={() => onTabChange('rooms')} className="text-xs font-semibold flex items-center gap-0.5 text-[#4A3AFF]">
                <span>전체 보기</span>
                <ChevronRight size={13} />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5">
              <motion.button whileTap={{
              scale: 0.96
            }} onClick={onAddRoom} className="flex-shrink-0 w-36 rounded-[20px] border-2 border-dashed border-[#D9DBE9] bg-white flex flex-col items-center justify-center gap-2 shadow-sm py-4">
                <div className="w-9 h-9 rounded-[12px] flex items-center justify-center bg-[#EAE8FF]">
                  <Plus size={18} className="text-[#4A3AFF]" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-[#170F49]">
                    <span>방 추가</span>
                  </p>
                  <p className="text-[10px] mt-0.5 text-[#A0A3BD]">
                    <span>촬영해서 추가</span>
                  </p>
                </div>
              </motion.button>

              {MY_ROOMS.map(room => <motion.button key={room.id} whileTap={{
              scale: 0.96
            }} onClick={() => onOpenRoom(room.id)} className="flex-shrink-0 w-36 rounded-[20px] overflow-hidden border border-white/60 shadow-md flex flex-col text-left">
                  <div className="w-full h-20 relative overflow-hidden">
                    <img src={room.heroImage} alt={room.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    {room.isFeatured && <div className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 bg-[#4A3AFF] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                        <Star size={7} className="fill-white" />
                        <span>대표</span>
                      </div>}
                  </div>
                  <div className="p-2.5 bg-white">
                    <p className="text-xs font-bold leading-tight text-[#170F49]">
                      <span>{room.name}</span>
                    </p>
                    <p className="text-[10px] mt-0.5 text-[#514F6E]">
                      <span>
                        {room.area} · {room.furnitureCount}개
                      </span>
                    </p>
                  </div>
                </motion.button>)}
            </div>
          </section>

          {/* Trending furniture */}
          <section className="px-5 mb-7">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Flame size={15} className="text-[#4A3AFF]" />
                <h2 className="text-[15px] font-bold text-[#170F49]">
                  <span>지금 트렌드</span>
                </h2>
              </div>
              <button onClick={() => onTabChange('catalog')} className="text-xs font-semibold flex items-center gap-0.5 text-[#4A3AFF]">
                <span>전체 보기</span>
                <ChevronRight size={13} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {POPULAR_FURNITURE.map((item, idx) => <motion.div key={item.id} initial={{
              opacity: 0,
              y: 14
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: idx * 0.07
            }} whileTap={{
              scale: 0.97
            }} onClick={() => onSnack(`${item.name} 상세 보기`, item.thumbnail)} className="rounded-[20px] p-4 flex flex-col gap-3 shadow-sm border border-[#F1F2F9] bg-white cursor-pointer">
                  <div className="w-full aspect-square rounded-[14px] flex items-center justify-center text-3xl" style={{
                backgroundColor: `${item.color}30`
              }}>
                    <span>{item.thumbnail}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold truncate text-[#170F49]">
                      <span>{item.name}</span>
                    </p>
                    <p className="text-[11px] mt-0.5 text-[#514F6E]">
                      <span>
                        {item.type} · {item.dimensions}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs font-bold text-[#4A3AFF]">{item.price}</span>
                    <div className="flex items-center gap-0.5">
                      <Star size={10} className="text-amber-400 fill-amber-400" />
                      <span className="text-[10px] text-[#A0A3BD]">{item.rating}</span>
                    </div>
                  </div>
                </motion.div>)}
            </div>
          </section>
        </div>
      </div>

      <BottomNav activeTab="home" onTabChange={onTabChange} />
    </motion.div>;
};
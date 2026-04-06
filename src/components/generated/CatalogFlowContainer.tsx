import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MainTab, FurnitureItem } from './Scan2RoomTypes';
import { ProductDetailScreen } from './ProductDetailScreen';
import { ALL_FURNITURE } from './Scan2RoomData';

// ─── Types ────────────────────────────────────────────────────────────────────

type CatalogFlow = 'list' | 'detail';
interface CatalogFlowContainerProps {
  onAddMyFurniture: () => void;
  onTabChange: (t: MainTab) => void;
  onSnack: (msg: string, icon?: string) => void;
}

// ─── Root component ───────────────────────────────────────────────────────────

export const CatalogFlowContainer = ({
  onAddMyFurniture,
  onTabChange,
  onSnack
}: CatalogFlowContainerProps) => {
  const [flow, setFlow] = useState<CatalogFlow>('list');
  const [selectedItem, setSelectedItem] = useState<FurnitureItem | null>(null);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set(ALL_FURNITURE.filter(f => f.isWishlisted).map(f => f.id)));
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
    // Bubble up — parent can handle navigation to room editor
    onSnack(`${item.name} 방에 추가됨`, item.thumbnail);
  };
  return <div className="absolute inset-0">
      <AnimatePresence mode="wait">
        {flow === 'list' && <CatalogListWithTap key="catalog-list" wishlistIds={wishlistIds} onAddMyFurniture={onAddMyFurniture} onTabChange={onTabChange} onSnack={onSnack} onOpenProduct={handleOpenProduct} onToggleWishlist={handleToggleWishlist} />}

        {flow === 'detail' && selectedItem && <ProductDetailScreen key={`detail-${selectedItem.id}`} item={selectedItem} isWishlisted={wishlistIds.has(selectedItem.id)} onBack={handleBackToList} onToggleWishlist={handleToggleWishlist} onAddToRoom={handleAddToRoom} onSnack={onSnack} />}
      </AnimatePresence>
    </div>;
};

// ─── Extended catalog list that intercepts item taps ─────────────────────────

import { motion } from 'framer-motion';
import { Scan, Camera, Heart, Star } from 'lucide-react';
import { CatalogCategory } from './Scan2RoomTypes';
import { CATEGORY_TABS } from './Scan2RoomData';
import { BottomNav, tabTransition } from './Scan2RoomShared';
interface CatalogListWithTapProps {
  wishlistIds: Set<string>;
  onAddMyFurniture: () => void;
  onTabChange: (t: MainTab) => void;
  onSnack: (msg: string, icon?: string) => void;
  onOpenProduct: (item: FurnitureItem) => void;
  onToggleWishlist: (id: string) => void;
}
const CatalogListWithTap = ({
  wishlistIds,
  onAddMyFurniture,
  onTabChange,
  onSnack,
  onOpenProduct,
  onToggleWishlist
}: CatalogListWithTapProps) => {
  const [activeCategory, setActiveCategory] = useState<CatalogCategory>('wishlist');
  const filteredItems: FurnitureItem[] = (() => {
    if (activeCategory === 'wishlist') return ALL_FURNITURE.filter(f => wishlistIds.has(f.id));
    if (activeCategory === 'myFurniture') return ALL_FURNITURE.filter(f => f.isMyFurniture);
    const typeMap: Record<string, string> = {
      sofa: 'Sofa',
      bed: 'Bed',
      table: 'Table',
      shelf: 'Shelf',
      chair: 'Chair'
    };
    return ALL_FURNITURE.filter(f => !f.isMyFurniture && f.type === typeMap[activeCategory]);
  })();
  const isMyFurnitureTab = activeCategory === 'myFurniture';
  return <motion.div {...tabTransition} className="absolute inset-0 bg-[#FBFBFE] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="pt-14 pb-4 px-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5 text-[#A0A3BD]">
              <span>Browse</span>
            </p>
            <h1 className="text-2xl font-bold text-[#170F49]">
              <span>카탈로그</span>
            </h1>
          </div>
          {isMyFurnitureTab && <motion.button whileTap={{
          scale: 0.95
        }} onClick={onAddMyFurniture} className="flex items-center gap-2 bg-[#4A3AFF] text-white text-sm font-semibold px-4 py-2.5 rounded-[14px] shadow-lg shadow-indigo-200">
              <Scan size={16} />
              <span>가구 스캔</span>
            </motion.button>}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6">
          {CATEGORY_TABS.map(cat => <motion.button key={cat.id} whileTap={{
          scale: 0.95
        }} onClick={() => setActiveCategory(cat.id)} className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-[12px] text-xs font-semibold transition-all ${activeCategory === cat.id ? 'bg-[#4A3AFF] text-white shadow-md shadow-indigo-200' : 'bg-white text-[#514F6E] border border-[#EAE8FF]'}`}>
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </motion.button>)}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-36">
        {/* Empty wishlist state */}
        {activeCategory === 'wishlist' && filteredItems.length === 0 && <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-14 h-14 rounded-[18px] flex items-center justify-center bg-[#EAE8FF]">
              <Heart size={24} className="text-[#4A3AFF]" />
            </div>
            <p className="text-sm font-bold text-[#170F49]">
              <span>찜한 가구가 없어요</span>
            </p>
            <p className="text-[11px] text-center text-[#A0A3BD]">
              <span>하트를 눌러 마음에 드는 가구를 저장하세요</span>
            </p>
          </div>}

        {/* My furniture scan CTA */}
        {isMyFurnitureTab && <motion.button whileTap={{
        scale: 0.98
      }} onClick={onAddMyFurniture} className="w-full mb-4 border-2 border-dashed border-[#D9DBE9] bg-white rounded-[20px] py-5 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-[14px] flex items-center justify-center bg-[#EAE8FF]">
              <Camera size={20} className="text-[#4A3AFF]" />
            </div>
            <p className="text-sm font-bold text-[#170F49]">
              <span>내 가구 추가</span>
            </p>
            <p className="text-[11px] text-[#A0A3BD]">
              <span>카메라로 가구를 촬영해 3D로 변환하세요</span>
            </p>
          </motion.button>}

        {/* Items grid */}
        {filteredItems.length > 0 && <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item, idx) => <motion.div key={item.id} initial={{
          opacity: 0,
          y: 12
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: idx * 0.05
        }} whileTap={{
          scale: 0.97
        }} onClick={() => onOpenProduct(item)} className="rounded-[20px] p-4 flex flex-col gap-3 shadow-sm border border-[#F1F2F9] bg-white cursor-pointer">
                <div className="relative">
                  <div className="w-full aspect-square rounded-[14px] flex items-center justify-center text-4xl" style={{
              backgroundColor: `${item.color}30`
            }}>
                    <span>{item.thumbnail}</span>
                  </div>
                  {/* Wishlist toggle */}
                  {!item.isMyFurniture && <motion.button whileTap={{
              scale: 0.8
            }} onClick={e => {
              e.stopPropagation();
              onToggleWishlist(item.id);
            }} className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md bg-white">
                      <Heart size={14} className={wishlistIds.has(item.id) ? 'text-red-400 fill-red-400' : 'text-[#A0A3BD]'} />
                    </motion.button>}
                  {item.isMyFurniture && <div className="absolute top-2 left-2 bg-[#4A3AFF] text-white text-[8px] font-bold px-2 py-0.5 rounded-full">
                      <span>내 가구</span>
                    </div>}
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
          </div>}
      </div>

      <BottomNav activeTab="catalog" onTabChange={onTabChange} />
    </motion.div>;
};
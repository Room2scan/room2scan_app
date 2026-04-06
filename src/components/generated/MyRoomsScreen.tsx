import React from 'react';
import { motion } from 'framer-motion';
import { Box, Star, Clock, Plus } from 'lucide-react';
import { MainTab } from './Scan2RoomTypes';
import { MY_ROOMS } from './Scan2RoomData';
import { BottomNav, tabTransition } from './Scan2RoomShared';
interface MyRoomsScreenProps {
  onOpenRoom: (roomId: string) => void;
  onAddRoom: () => void;
  onTabChange: (t: MainTab) => void;
}
export const MyRoomsScreen = ({
  onOpenRoom,
  onAddRoom,
  onTabChange
}: MyRoomsScreenProps) => <motion.div {...tabTransition} className="absolute inset-0 bg-[#FBFBFE] flex flex-col overflow-hidden">
    <div className="pt-14 pb-4 px-5 flex-shrink-0">
      <p className="text-xs font-semibold uppercase tracking-widest mb-0.5 text-[#A0A3BD]">
        <span>My Spaces</span>
      </p>
      <h1 className="text-2xl font-bold text-[#170F49]">
        <span>내 방</span>
      </h1>
    </div>

    <div className="flex-1 overflow-y-auto px-5 pb-36">
      <div className="space-y-4">
        {MY_ROOMS.map(room => <motion.button key={room.id} whileTap={{
        scale: 0.985
      }} onClick={() => onOpenRoom(room.id)} className="w-full text-left rounded-[20px] overflow-hidden bg-white shadow-sm border border-[#F1F2F9]">
            <div className="flex h-44 gap-0.5">
              <div className="relative flex-1 overflow-hidden">
                <img src={room.heroImage} alt={`${room.name} 3D 뷰`} className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-[8px]" style={{
              backgroundColor: 'rgba(10,8,30,0.65)',
              backdropFilter: 'blur(8px)'
            }}>
                  <Box size={10} color="rgba(137,127,255,1)" strokeWidth={2} />
                  <span className="text-white text-[9px] font-bold tracking-wide">3D VIEW</span>
                </div>
                {room.isFeatured && <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-[#4A3AFF] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    <Star size={7} className="fill-white" />
                    <span>대표</span>
                  </div>}
              </div>
              <div className="flex flex-col gap-0.5 w-[34%]">
                {room.realPhotos.map((photo, pi) => <div key={`rp-${room.id}-${pi}`} className="flex-1 overflow-hidden relative">
                    <img src={photo} alt={`${room.name} 실제 사진 ${pi + 1}`} className="w-full h-full object-cover" />
                    {pi === room.realPhotos.length - 1 && <div className="absolute inset-0 flex items-center justify-center" style={{
                backgroundColor: 'rgba(0,0,0,0.28)'
              }}>
                        <span className="text-white text-[10px] font-bold">실제 사진</span>
                      </div>}
                  </div>)}
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-[15px] font-bold text-[#170F49]">
                      <span>{room.name}</span>
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EAE8FF] text-[#4A3AFF]">
                      편집 가능
                    </span>
                  </div>
                  <p className="text-[12px] text-[#514F6E]">
                    <span>
                      {room.area} · 가구 {room.furnitureCount}개
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                  <Clock size={10} className="text-[#A0A3BD]" />
                  <span className="text-[11px] text-[#A0A3BD]">{room.lastEdited}</span>
                </div>
              </div>
            </div>
          </motion.button>)}
      </div>
    </div>

    <div className="absolute bottom-28 left-0 right-0 flex justify-center z-30 pointer-events-none">
      <motion.button whileTap={{
      scale: 0.93
    }} whileHover={{
      scale: 1.04
    }} onClick={onAddRoom} className="pointer-events-auto flex items-center gap-2.5 bg-[#4A3AFF] text-white text-sm font-bold px-6 py-4 rounded-[22px] shadow-2xl" style={{
      boxShadow: '0 8px 28px rgba(74,58,255,0.38)'
    }}>
        <Plus size={20} />
        <span>새 방 추가하기</span>
      </motion.button>
    </div>

    <BottomNav activeTab="rooms" onTabChange={onTabChange} />
  </motion.div>;
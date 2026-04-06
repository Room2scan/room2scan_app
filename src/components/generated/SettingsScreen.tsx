import React from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { MainTab } from './Scan2RoomTypes';
import { BottomNav, tabTransition } from './Scan2RoomShared';
interface SettingsScreenProps {
  onTabChange: (t: MainTab) => void;
}
export const SettingsScreen = ({
  onTabChange
}: SettingsScreenProps) => <motion.div {...tabTransition} className="absolute inset-0 flex flex-col bg-[#FBFBFE]">
    <div className="pt-14 pb-4 px-6 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5 text-[#A0A3BD]">
          <span>Preferences</span>
        </p>
        <h1 className="text-2xl font-bold text-[#170F49]">
          <span>설정</span>
        </h1>
      </div>
    </div>
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 opacity-30">
        <Settings size={40} className="text-[#A0A3BD]" />
        <p className="text-sm text-[#A0A3BD]">
          <span>더 많은 설정 준비 중</span>
        </p>
      </div>
    </div>
    <BottomNav activeTab="settings" onTabChange={onTabChange} />
  </motion.div>;
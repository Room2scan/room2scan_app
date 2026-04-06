import React from 'react';
import { motion } from 'framer-motion';
import { Home, Box, Sofa, Settings, type LucideIcon } from 'lucide-react';
import { MainTab, SnackbarItem } from './Scan2RoomTypes';
import { AnimatePresence } from 'framer-motion';

// ─── Transition preset ────────────────────────────────────────────────────────

export const tabTransition = {
  initial: {
    opacity: 0,
    y: 8
  },
  animate: {
    opacity: 1,
    y: 0
  },
  exit: {
    opacity: 0,
    y: -5
  },
  transition: {
    duration: 0.26,
    ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number]
  }
};

// ─── GlassCard ────────────────────────────────────────────────────────────────

export const GlassCard = ({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`backdrop-blur-xl bg-white/70 border border-white/40 shadow-xl rounded-[24px] ${className}`}>
    {children}
  </div>;

// ─── IconButton ───────────────────────────────────────────────────────────────

export const IconButton = ({
  icon: Icon,
  onClick,
  active = false,
  size = 22
}: {
  icon: LucideIcon;
  onClick?: () => void;
  active?: boolean;
  size?: number;
}) => <motion.button whileTap={{
  scale: 0.9
}} onClick={onClick} className={`p-3 rounded-full transition-all ${active ? 'bg-[#4A3AFF] text-white shadow-lg shadow-indigo-200' : 'bg-white/80 text-[#514F6E] backdrop-blur-md border border-white/50'}`}>
    <Icon size={size} />
  </motion.button>;

// ─── SnackbarContainer ────────────────────────────────────────────────────────

export const SnackbarContainer = ({
  snacks,
  onDismiss
}: {
  snacks: SnackbarItem[];
  onDismiss: (id: string) => void;
}) => <div className="absolute bottom-36 left-0 right-0 flex flex-col items-center gap-2 z-[100] pointer-events-none px-5">
    <AnimatePresence>
      {snacks.map(snack => <motion.div key={snack.id} initial={{
      opacity: 0,
      y: 16,
      scale: 0.92
    }} animate={{
      opacity: 1,
      y: 0,
      scale: 1
    }} exit={{
      opacity: 0,
      y: -8,
      scale: 0.95
    }} transition={{
      type: 'spring',
      damping: 22,
      stiffness: 300
    }} className="bg-[#170F49] text-white text-sm font-semibold px-5 py-3 rounded-[18px] shadow-xl flex items-center gap-2.5 pointer-events-auto">
          {snack.icon && <span className="text-base">{snack.icon}</span>}
          <span>{snack.message}</span>
        </motion.div>)}
    </AnimatePresence>
  </div>;

// ─── Bottom Navigation ────────────────────────────────────────────────────────

const NAV_TABS: {
  id: MainTab;
  icon: LucideIcon;
  label: string;
}[] = [{
  id: 'home',
  icon: Home,
  label: '홈'
}, {
  id: 'rooms',
  icon: Box,
  label: '내 방'
}, {
  id: 'catalog',
  icon: Sofa,
  label: '카탈로그'
}, {
  id: 'settings',
  icon: Settings,
  label: '설정'
}];
export const BottomNav = ({
  activeTab,
  onTabChange
}: {
  activeTab: MainTab;
  onTabChange: (t: MainTab) => void;
}) => <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-7 pt-3 pointer-events-none z-20" style={{
  background: 'linear-gradient(to top, rgba(251,251,254,0.98) 60%, rgba(251,251,254,0) 100%)'
}}>
    <div className="flex items-center gap-1 px-2 py-2 pointer-events-auto" style={{
    background: 'rgba(255,255,255,0.60)',
    backdropFilter: 'blur(28px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.72)',
    boxShadow: '0 8px 32px rgba(74,58,255,0.09), 0 1px 0 rgba(255,255,255,0.85) inset, 0 2px 14px rgba(0,0,0,0.08)'
  }}>
      {NAV_TABS.map(tab => <motion.button key={tab.id} whileTap={{
      scale: 0.91
    }} onClick={() => onTabChange(tab.id)} className="relative flex items-center justify-center" style={{
      borderRadius: '999px'
    }}>
          {activeTab === tab.id ? <motion.div layoutId="nav-active-pill" className="flex items-center gap-1.5 px-4 py-2.5" style={{
        background: 'linear-gradient(135deg, #4A3AFF 0%, #7B6FFF 100%)',
        borderRadius: '999px',
        boxShadow: '0 4px 16px rgba(74,58,255,0.32)'
      }} transition={{
        type: 'spring',
        damping: 26,
        stiffness: 340
      }}>
              <tab.icon size={17} color="white" strokeWidth={2.2} />
              <span className="text-white font-bold overflow-hidden whitespace-nowrap" style={{
          fontSize: '12px'
        }}>
                {tab.label}
              </span>
            </motion.div> : <div className="flex items-center justify-center px-4 py-2.5" style={{
        minWidth: '52px'
      }}>
              <tab.icon size={20} color="#A0A3BD" strokeWidth={1.8} />
            </div>}
        </motion.button>)}
    </div>
  </div>;
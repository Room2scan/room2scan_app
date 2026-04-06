import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ─────────────────────────────────────────────────────────────────────

type ReconstructionPhase = 'frames' | 'pointcloud' | 'mesh' | 'structure' | 'complete';
interface ReconstructionScreenProps {
  onComplete: () => void;
}

// ─── Phase config ─────────────────────────────────────────────────────────────

interface PhaseConfig {
  label: string;
  sublabel: string;
  duration: number;
  progressTarget: number;
}
const PHASES: Record<ReconstructionPhase, PhaseConfig> = {
  frames: {
    label: '프레임 분석 중',
    sublabel: '캡처된 이미지를 처리하는 중...',
    duration: 1400,
    progressTarget: 20
  },
  pointcloud: {
    label: '포인트 클라우드 생성',
    sublabel: '공간 좌표를 계산하는 중...',
    duration: 1600,
    progressTarget: 50
  },
  mesh: {
    label: '메쉬 재구성 중',
    sublabel: '표면 구조를 연결하는 중...',
    duration: 1500,
    progressTarget: 75
  },
  structure: {
    label: '공간 구조 완성',
    sublabel: '벽, 바닥, 천장을 인식하는 중...',
    duration: 1200,
    progressTarget: 92
  },
  complete: {
    label: '완성!',
    sublabel: '3D 공간이 생성되었습니다',
    duration: 800,
    progressTarget: 100
  }
};
const PHASE_ORDER: ReconstructionPhase[] = ['frames', 'pointcloud', 'mesh', 'structure', 'complete'];

// ─── Floating captured frames (phase 1) ──────────────────────────────────────

const FLOAT_FRAME_CONFIGS = [{
  delay: 0,
  x: -120,
  y: -60,
  rotate: -12,
  scale: 0.82
}, {
  delay: 0.12,
  x: -60,
  y: -90,
  rotate: 4,
  scale: 0.9
}, {
  delay: 0.22,
  x: 10,
  y: -80,
  rotate: -3,
  scale: 0.95
}, {
  delay: 0.32,
  x: 75,
  y: -65,
  rotate: 8,
  scale: 0.87
}, {
  delay: 0.42,
  x: 125,
  y: -45,
  rotate: -6,
  scale: 0.78
}];
const FRAME_BG_COLORS = ['from-indigo-900 to-slate-900', 'from-slate-800 to-indigo-900', 'from-purple-900 to-slate-900', 'from-indigo-800 to-purple-900', 'from-slate-900 to-purple-800'];
const FloatingFrames = ({
  visible,
  dissolving
}: {
  visible: boolean;
  dissolving: boolean;
}) => <div className="relative w-48 h-48 flex items-center justify-center">
    {FLOAT_FRAME_CONFIGS.map((cfg, i) => <motion.div key={`frame-float-${i}`} initial={{
    opacity: 0,
    x: 0,
    y: 30,
    scale: 0.6,
    rotate: 0
  }} animate={visible ? dissolving ? {
    opacity: 0,
    scale: 0.4,
    x: cfg.x * 0.3,
    y: cfg.y * 0.3,
    rotate: cfg.rotate * 2,
    filter: 'blur(8px)'
  } : {
    opacity: 1,
    x: cfg.x,
    y: cfg.y,
    scale: cfg.scale,
    rotate: cfg.rotate,
    filter: 'blur(0px)'
  } : {
    opacity: 0
  }} transition={{
    delay: cfg.delay,
    type: 'spring',
    damping: 18,
    stiffness: 140
  }} className={`absolute w-16 h-11 rounded-[8px] bg-gradient-to-br ${FRAME_BG_COLORS[i]} border border-white/10`} style={{
    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 25%, transparent 25%)',
    backgroundSize: '8px 8px'
  }} />)}
  </div>;

// ─── Point cloud animation ────────────────────────────────────────────────────

const POINT_COUNT = 52;
interface PointConfig {
  id: number;
  cx: number;
  cy: number;
  r: number;
  delay: number;
  color: string;
}
const generatePoints = (): PointConfig[] => {
  const colors = ['rgba(99,102,241,0.9)', 'rgba(139,92,246,0.7)', 'rgba(167,139,250,0.6)', 'rgba(196,181,253,0.4)'];
  return Array.from({
    length: POINT_COUNT
  }, (_, i) => {
    const angle = i / POINT_COUNT * Math.PI * 2;
    const radius = 50 + Math.sin(i * 2.4) * 28 + Math.cos(i * 1.7) * 20;
    const cx = 96 + Math.cos(angle) * radius;
    const cy = 96 + Math.sin(angle) * radius * 0.6;
    return {
      id: i,
      cx,
      cy,
      r: 1.5 + Math.random() * 2.5,
      delay: i * 0.025,
      color: colors[i % colors.length]
    };
  });
};
const POINT_DATA = generatePoints();
const PointCloudViz = ({
  visible,
  dissolving
}: {
  visible: boolean;
  dissolving: boolean;
}) => <svg width="192" height="192" viewBox="0 0 192 192" className="overflow-visible">
    {POINT_DATA.map(pt => <motion.circle key={pt.id} cx={pt.cx} cy={pt.cy} r={pt.r} fill={pt.color} initial={{
    opacity: 0,
    scale: 0
  }} animate={visible ? dissolving ? {
    opacity: 0,
    scale: 1.5,
    filter: 'blur(3px)'
  } : {
    opacity: 1,
    scale: 1
  } : {
    opacity: 0
  }} transition={{
    delay: pt.delay,
    duration: 0.3
  }} />)}
    {/* Connecting lines */}
    {visible && !dissolving && POINT_DATA.slice(0, 20).map((pt, i) => {
    const next = POINT_DATA[(i + 3) % POINT_DATA.length];
    return <motion.line key={`line-${pt.id}`} x1={pt.cx} y1={pt.cy} x2={next.cx} y2={next.cy} stroke="rgba(99,102,241,0.15)" strokeWidth="0.8" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      delay: pt.delay + 0.4,
      duration: 0.4
    }} />;
  })}
  </svg>;

// ─── Mesh wireframe animation ─────────────────────────────────────────────────

const MeshViz = ({
  visible,
  dissolving
}: {
  visible: boolean;
  dissolving: boolean;
}) => {
  const rows = 7;
  const cols = 10;
  return <svg width="192" height="192" viewBox="0 0 192 192">
      {/* Floor plane */}
      {Array.from({
      length: rows
    }, (_, row) => Array.from({
      length: cols
    }, (_, col) => {
      const x1 = 16 + col * 16;
      const y1 = 80 + row * 12 + col * 1.5;
      const x2 = x1 + 16;
      const y2 = y1 + 1.5;
      return <motion.line key={`h-${row}-${col}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(99,102,241,0.5)" strokeWidth="0.8" initial={{
        opacity: 0,
        pathLength: 0
      }} animate={visible ? dissolving ? {
        opacity: 0
      } : {
        opacity: 1
      } : {
        opacity: 0
      }} transition={{
        delay: (row * cols + col) * 0.012,
        duration: 0.25
      }} />;
    }))}
      {/* Back wall */}
      {Array.from({
      length: 4
    }, (_, row) => Array.from({
      length: cols
    }, (_, col) => {
      const x1 = 16 + col * 16;
      const y1 = 24 + row * 14;
      const x2 = x1 + 16;
      const y2 = y1;
      return <motion.line key={`w-${row}-${col}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(139,92,246,0.35)" strokeWidth="0.7" initial={{
        opacity: 0
      }} animate={visible ? dissolving ? {
        opacity: 0
      } : {
        opacity: 1
      } : {
        opacity: 0
      }} transition={{
        delay: 0.3 + (row * cols + col) * 0.008,
        duration: 0.2
      }} />;
    }))}
      {/* Vertical lines connecting wall to floor */}
      {Array.from({
      length: cols + 1
    }, (_, col) => <motion.line key={`v-${col}`} x1={16 + col * 16} y1={24} x2={16 + col * 16} y2={80} stroke="rgba(167,139,250,0.25)" strokeWidth="0.7" initial={{
      opacity: 0
    }} animate={visible ? dissolving ? {
      opacity: 0
    } : {
      opacity: 1
    } : {
      opacity: 0
    }} transition={{
      delay: 0.5 + col * 0.04,
      duration: 0.2
    }} />)}
    </svg>;
};

// ─── Filled structure ─────────────────────────────────────────────────────────

const StructureViz = ({
  visible
}: {
  visible: boolean;
}) => <svg width="192" height="192" viewBox="0 0 192 192">
    {/* Floor - filled */}
    <motion.rect x="16" y="80" width="160" height="96" rx="2" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.4)" strokeWidth="1" initial={{
    opacity: 0,
    scaleY: 0
  }} animate={visible ? {
    opacity: 1,
    scaleY: 1
  } : {
    opacity: 0
  }} style={{
    transformOrigin: 'bottom center'
  }} transition={{
    duration: 0.5,
    delay: 0.1
  }} />
    {/* Back wall */}
    <motion.rect x="16" y="24" width="160" height="56" rx="2" fill="rgba(139,92,246,0.08)" stroke="rgba(139,92,246,0.35)" strokeWidth="1" initial={{
    opacity: 0,
    scaleY: 0
  }} animate={visible ? {
    opacity: 1,
    scaleY: 1
  } : {
    opacity: 0
  }} style={{
    transformOrigin: 'top center'
  }} transition={{
    duration: 0.5,
    delay: 0.25
  }} />
    {/* Left wall */}
    <motion.rect x="16" y="24" width="20" height="152" rx="2" fill="rgba(167,139,250,0.06)" stroke="rgba(167,139,250,0.25)" strokeWidth="0.8" initial={{
    opacity: 0
  }} animate={visible ? {
    opacity: 1
  } : {
    opacity: 0
  }} transition={{
    duration: 0.4,
    delay: 0.4
  }} />
    {/* Furniture hints */}
    <motion.rect x="40" y="110" width="48" height="28" rx="4" fill="rgba(99,102,241,0.2)" stroke="rgba(99,102,241,0.5)" strokeWidth="1" initial={{
    opacity: 0,
    scale: 0.8
  }} animate={visible ? {
    opacity: 1,
    scale: 1
  } : {
    opacity: 0
  }} style={{
    transformOrigin: 'center'
  }} transition={{
    duration: 0.4,
    delay: 0.6
  }} />
    <motion.rect x="110" y="90" width="32" height="48" rx="4" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" initial={{
    opacity: 0,
    scale: 0.8
  }} animate={visible ? {
    opacity: 1,
    scale: 1
  } : {
    opacity: 0
  }} style={{
    transformOrigin: 'center'
  }} transition={{
    duration: 0.4,
    delay: 0.75
  }} />
    {/* Grid overlay */}
    {Array.from({
    length: 6
  }, (_, i) => <motion.line key={`grid-h-${i}`} x1="16" y1={80 + i * 16} x2="176" y2={80 + i * 16} stroke="rgba(99,102,241,0.08)" strokeWidth="0.5" initial={{
    opacity: 0
  }} animate={visible ? {
    opacity: 1
  } : {
    opacity: 0
  }} transition={{
    delay: 0.3 + i * 0.05
  }} />)}
  </svg>;

// ─── Phase visualization switcher ─────────────────────────────────────────────

const PhaseViz = ({
  phase,
  nextPhase
}: {
  phase: ReconstructionPhase;
  nextPhase: ReconstructionPhase | null;
}) => {
  const dissolving = nextPhase !== null;
  return <div className="relative w-48 h-48 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {phase === 'frames' && <motion.div key="frames" exit={{
        opacity: 0,
        scale: 0.8
      }} transition={{
        duration: 0.4
      }}>
            <FloatingFrames visible dissolving={dissolving} />
          </motion.div>}
        {phase === 'pointcloud' && <motion.div key="pointcloud" initial={{
        opacity: 0,
        scale: 0.8
      }} animate={{
        opacity: 1,
        scale: 1
      }} exit={{
        opacity: 0,
        scale: 0.8
      }} transition={{
        duration: 0.4
      }}>
            <PointCloudViz visible dissolving={dissolving} />
          </motion.div>}
        {phase === 'mesh' && <motion.div key="mesh" initial={{
        opacity: 0,
        scale: 0.9
      }} animate={{
        opacity: 1,
        scale: 1
      }} exit={{
        opacity: 0,
        scale: 0.9
      }} transition={{
        duration: 0.4
      }}>
            <MeshViz visible dissolving={dissolving} />
          </motion.div>}
        {(phase === 'structure' || phase === 'complete') && <motion.div key="structure" initial={{
        opacity: 0,
        scale: 0.9
      }} animate={{
        opacity: 1,
        scale: 1
      }} exit={{
        opacity: 0
      }} transition={{
        duration: 0.5
      }}>
            <StructureViz visible />
          </motion.div>}
      </AnimatePresence>

      {/* Orbit ring */}
      <motion.div animate={{
      rotate: 360
    }} transition={{
      duration: 10,
      repeat: Infinity,
      ease: 'linear'
    }} className="absolute inset-0 rounded-full pointer-events-none" style={{
      border: '1.5px dashed rgba(99,102,241,0.2)',
      borderRadius: '50%'
    }} />
    </div>;
};

// ─── Progress steps ───────────────────────────────────────────────────────────

const ProgressSteps = ({
  currentPhase
}: {
  currentPhase: ReconstructionPhase;
}) => {
  const stepIndex = PHASE_ORDER.indexOf(currentPhase);
  const steps: {
    phase: ReconstructionPhase;
    label: string;
  }[] = [{
    phase: 'frames',
    label: '프레임'
  }, {
    phase: 'pointcloud',
    label: '포인트'
  }, {
    phase: 'mesh',
    label: '메쉬'
  }, {
    phase: 'structure',
    label: '공간'
  }, {
    phase: 'complete',
    label: '완성'
  }];
  return <div className="flex items-center gap-1">
      {steps.map((step, i) => {
      const done = PHASE_ORDER.indexOf(step.phase) < stepIndex;
      const active = step.phase === currentPhase;
      return <div key={step.phase} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <motion.div animate={{
            backgroundColor: done ? 'rgb(99,102,241)' : active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
            scale: active ? 1.2 : 1
          }} className="rounded-full" style={{
            width: active ? '8px' : '6px',
            height: active ? '8px' : '6px'
          }} transition={{
            duration: 0.3
          }} />
              <span className="text-[8px] font-semibold transition-colors duration-300" style={{
            color: done ? 'rgb(99,102,241)' : active ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)'
          }}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && <div className="w-5 h-px mb-3 transition-all duration-500" style={{
          backgroundColor: done ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.1)'
        }} />}
          </div>;
    })}
    </div>;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const ReconstructionScreen = ({
  onComplete
}: ReconstructionScreenProps) => {
  const [currentPhase, setCurrentPhase] = useState<ReconstructionPhase>('frames');
  const [progress, setProgress] = useState(0);
  const phaseIndexRef = useRef(0);
  useEffect(() => {
    let elapsed = 0;
    const totalDuration = PHASE_ORDER.reduce((sum, p) => sum + PHASES[p].duration, 0);
    const advancePhase = () => {
      const idx = phaseIndexRef.current;
      if (idx >= PHASE_ORDER.length - 1) {
        // Last phase = complete
        setProgress(100);
        setCurrentPhase('complete');
        setTimeout(onComplete, 900);
        return;
      }
      const phase = PHASE_ORDER[idx];
      const config = PHASES[phase];
      elapsed += config.duration;
      setCurrentPhase(PHASE_ORDER[idx + 1]);
      phaseIndexRef.current = idx + 1;
      if (idx + 1 < PHASE_ORDER.length - 1) {
        setTimeout(advancePhase, PHASES[PHASE_ORDER[idx + 1]].duration);
      } else {
        // complete
        setTimeout(() => {
          setProgress(100);
          setTimeout(onComplete, 900);
        }, PHASES['complete'].duration);
      }
    };

    // Animate progress smoothly
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const t = Date.now() - startTime;
      const p = Math.min(t / totalDuration * 100, 99);
      setProgress(p);
    }, 60);
    const firstTimeout = setTimeout(advancePhase, PHASES['frames'].duration);
    return () => {
      clearTimeout(firstTimeout);
      clearInterval(progressInterval);
    };
  }, [onComplete]);
  const config = PHASES[currentPhase];
  return <motion.div initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} exit={{
    opacity: 0,
    scale: 1.05
  }} transition={{
    duration: 0.5
  }} className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden" style={{
    zIndex: 50,
    backgroundColor: '#060510'
  }}>
      {/* Background glow */}
      <motion.div animate={{
      opacity: [0.3, 0.6, 0.3]
    }} transition={{
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut'
    }} className="absolute inset-0 pointer-events-none" style={{
      background: 'radial-gradient(ellipse at 50% 40%, rgba(74,58,255,0.18) 0%, rgba(99,102,241,0.08) 40%, transparent 70%)'
    }} />

      {/* Ambient noise pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
      backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
      backgroundSize: '32px 32px'
    }} />

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-8 px-8 w-full max-w-sm">
        {/* Visualization area */}
        <div className="relative">
          <PhaseViz phase={currentPhase} nextPhase={null} />
        </div>

        {/* Text block */}
        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.div key={currentPhase} initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} exit={{
            opacity: 0,
            y: -10
          }} transition={{
            duration: 0.4
          }}>
              <p className="text-white font-bold text-xl mb-1.5">{config.label}</p>
              <p className="text-white/40 text-[13px]">{config.sublabel}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress steps */}
        <ProgressSteps currentPhase={currentPhase} />

        {/* Progress bar */}
        <div className="w-full">
          <div className="w-full rounded-full overflow-hidden" style={{
          height: '3px',
          backgroundColor: 'rgba(255,255,255,0.08)'
        }}>
            <motion.div className="h-full rounded-full" style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #4A3AFF 0%, #897FFF 60%, #a78bfa 100%)',
            boxShadow: '0 0 10px rgba(74,58,255,0.5)'
          }} transition={{
            duration: 0.3,
            ease: 'easeOut'
          }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-white/25 text-[10px]">공간을 재구성하는 중…</span>
            <span className="text-white/50 text-[11px] font-bold">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Complete flash */}
      <AnimatePresence>
        {currentPhase === 'complete' && <motion.div key="flash" initial={{
        opacity: 0.6
      }} animate={{
        opacity: 0
      }} transition={{
        duration: 0.8
      }} className="absolute inset-0 pointer-events-none" style={{
        backgroundColor: 'rgba(99,102,241,0.15)'
      }} />}
      </AnimatePresence>
    </motion.div>;
};
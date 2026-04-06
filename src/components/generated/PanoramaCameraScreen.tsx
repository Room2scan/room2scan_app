import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimationFrame } from 'framer-motion';
import { ChevronLeft, RotateCcw, Zap, AlertTriangle } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type ScanPhase = 'idle' | 'scanning' | 'complete';
type WarningType = 'tooFast' | 'offPath' | 'notLevel' | null;
type CameraMode = 'room' | 'furniture';
interface PanoramaCameraScreenProps {
  onProcess: () => void;
  onBack: () => void;
  mode?: CameraMode;
}

// ─── Mock camera frames (previous captures preview) ─────────────────────────

const FRAME_COLORS = ['from-indigo-900/80 to-purple-900/80', 'from-slate-800/80 to-indigo-900/80', 'from-purple-900/80 to-slate-900/80', 'from-indigo-800/80 to-slate-800/80', 'from-slate-900/80 to-purple-800/80'];
const SCAN_STEPS = [{
  label: '왼쪽 벽',
  done: false
}, {
  label: '중앙',
  done: false
}, {
  label: '오른쪽 벽',
  done: false
}, {
  label: '천장',
  done: false
}];
const MODE_LABELS: Record<CameraMode, {
  title: string;
  instruction: string;
  subInstruction: string;
}> = {
  room: {
    title: '방 스캔',
    instruction: '천천히, 일정한 속도로 움직이세요',
    subInstruction: '왼쪽에서 오른쪽으로 부드럽게 이동'
  },
  furniture: {
    title: '가구 스캔',
    instruction: '가구 주변을 천천히 돌며 촬영하세요',
    subInstruction: '360° 전체가 포착되도록'
  }
};
const WARNING_MESSAGES: Record<NonNullable<WarningType>, {
  text: string;
  color: string;
}> = {
  tooFast: {
    text: '속도가 너무 빠릅니다',
    color: 'rgb(239,68,68)'
  },
  offPath: {
    text: '경로를 벗어났습니다',
    color: 'rgb(245,158,11)'
  },
  notLevel: {
    text: '카메라를 수평으로 유지하세요',
    color: 'rgb(245,158,11)'
  }
};

// ─── Horizontal Alignment Guide ───────────────────────────────────────────────

const AlignmentGuide = ({
  isScanning,
  tilt
}: {
  isScanning: boolean;
  tilt: number;
}) => {
  const isOffLevel = Math.abs(tilt) > 8;
  const lineColor = !isScanning ? 'rgba(255,255,255,0.18)' : isOffLevel ? 'rgba(245,158,11,0.85)' : 'rgba(99,102,241,0.7)';
  return <div className="absolute inset-x-0" style={{
    top: '42%',
    zIndex: 10,
    pointerEvents: 'none'
  }}>
      {/* Center notch left */}
      <div className="absolute left-4 w-6 h-[2px] rounded-full transition-colors duration-300" style={{
      backgroundColor: lineColor,
      top: '50%',
      transform: 'translateY(-50%)'
    }} />
      {/* Center dot */}
      <div className="absolute left-1/2 w-2 h-2 rounded-full transition-colors duration-300 border border-white/40" style={{
      backgroundColor: lineColor,
      top: '50%',
      transform: 'translate(-50%, -50%)',
      boxShadow: isScanning && !isOffLevel ? '0 0 8px rgba(99,102,241,0.6)' : 'none'
    }} />
      {/* Center notch right */}
      <div className="absolute right-4 w-6 h-[2px] rounded-full transition-colors duration-300" style={{
      backgroundColor: lineColor,
      top: '50%',
      transform: 'translateY(-50%)'
    }} />
      {/* Full line */}
      <div className="absolute inset-x-10 h-px transition-all duration-500" style={{
      backgroundColor: lineColor,
      top: '50%',
      transform: `translateY(-50%) rotate(${tilt * 0.4}deg)`,
      transformOrigin: 'center',
      opacity: isScanning ? 1 : 0.4
    }} />
    </div>;
};

// ─── Motion Direction Arrow ────────────────────────────────────────────────────

const MotionArrow = ({
  isScanning,
  mode
}: {
  isScanning: boolean;
  mode: CameraMode;
}) => {
  if (!isScanning) return null;
  const arrowCount = mode === 'room' ? 3 : 1;
  const arrows = Array.from({
    length: arrowCount
  }, (_, i) => i);
  if (mode === 'furniture') {
    return <div className="flex items-center justify-center gap-1">
        {[...arrows, ...arrows].map((_, i) => <motion.div key={`arrow-circ-${i}`} initial={{
        opacity: 0,
        x: -4
      }} animate={{
        opacity: [0, 1, 0],
        x: ['-4px', '0px', '4px']
      }} transition={{
        duration: 1.4,
        repeat: Infinity,
        delay: i * 0.2,
        ease: 'easeInOut'
      }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{
          backgroundColor: 'rgba(99,102,241,0.85)'
        }} />
          </motion.div>)}
      </div>;
  }
  return <div className="flex items-center gap-0.5">
      {arrows.map((_, i) => <motion.div key={`arrow-${i}`} initial={{
      opacity: 0.2
    }} animate={{
      opacity: [0.2, 1, 0.2]
    }} transition={{
      duration: 1.6,
      repeat: Infinity,
      delay: i * 0.28,
      ease: 'easeInOut'
    }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M6 4L12 9L6 14" stroke="rgba(99,102,241,0.95)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>)}
    </div>;
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const ScanProgressBar = ({
  progress,
  isScanning
}: {
  progress: number;
  isScanning: boolean;
}) => <div className="w-full">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">
        {isScanning ? '스캔 진행' : '대기 중'}
      </span>
      <span className="text-white font-bold text-[11px]">{Math.round(progress)}%</span>
    </div>
    <div className="w-full rounded-full overflow-hidden" style={{
    height: '4px',
    backgroundColor: 'rgba(255,255,255,0.12)'
  }}>
      <motion.div className="h-full rounded-full" style={{
      background: 'linear-gradient(90deg, #4A3AFF 0%, #897FFF 60%, #a78bfa 100%)',
      width: `${progress}%`,
      boxShadow: '0 0 8px rgba(74,58,255,0.6)'
    }} transition={{
      duration: 0.3,
      ease: 'easeOut'
    }} />
    </div>
  </div>;

// ─── Frame Preview Strip ──────────────────────────────────────────────────────

const FramePreviewStrip = ({
  capturedFrames,
  isScanning
}: {
  capturedFrames: number;
  isScanning: boolean;
}) => <div className="flex flex-col items-end gap-2">
    <span className="text-white/50 text-[9px] font-bold uppercase tracking-wider">
      캡처됨 {capturedFrames}
    </span>
    <div className="flex flex-col gap-1">
      {FRAME_COLORS.slice(0, Math.min(capturedFrames, 5)).map((gradient, i) => <motion.div key={`frame-${i}`} initial={{
      opacity: 0,
      x: 16,
      scale: 0.85
    }} animate={{
      opacity: 1,
      x: 0,
      scale: 1
    }} transition={{
      duration: 0.35,
      ease: 'easeOut'
    }} className={`w-[52px] h-9 rounded-[6px] bg-gradient-to-br ${gradient} border border-white/20 overflow-hidden`} style={{
      opacity: 0.7 + i / 5 * 0.3,
      transform: `scale(${0.92 + i / 5 * 0.08})`
    }}>
          <div className="w-full h-full" style={{
        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.06) 25%, transparent 25%)',
        backgroundSize: '6px 6px'
      }} />
        </motion.div>)}
      {capturedFrames === 0 && <div className="w-[52px] h-9 rounded-[6px] border border-dashed border-white/20 flex items-center justify-center" style={{
      backgroundColor: 'rgba(255,255,255,0.05)'
    }}>
          <span className="text-white/20 text-[8px]">—</span>
        </div>}
    </div>
    {isScanning && <motion.div animate={{
    opacity: [1, 0.3, 1]
  }} transition={{
    duration: 1.2,
    repeat: Infinity
  }} className="w-[52px] h-1.5 rounded-full" style={{
    backgroundColor: 'rgba(99,102,241,0.5)'
  }} />}
  </div>;

// ─── Warning Toast ────────────────────────────────────────────────────────────

const WarningToast = ({
  warning
}: {
  warning: WarningType;
}) => <AnimatePresence>
    {warning && <motion.div key={warning} initial={{
    opacity: 0,
    y: -12,
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
    damping: 20,
    stiffness: 280
  }} className="flex items-center gap-2 px-4 py-2.5 rounded-[14px]" style={{
    backgroundColor: `${WARNING_MESSAGES[warning].color}22`,
    border: `1px solid ${WARNING_MESSAGES[warning].color}55`,
    backdropFilter: 'blur(16px)'
  }}>
        <AlertTriangle size={13} style={{
      color: WARNING_MESSAGES[warning].color
    }} />
        <span className="text-white text-[12px] font-semibold">{WARNING_MESSAGES[warning].text}</span>
      </motion.div>}
  </AnimatePresence>;

// ─── Scan Complete Overlay ────────────────────────────────────────────────────

const ScanCompleteOverlay = ({
  onConfirm,
  onRetake
}: {
  onConfirm: () => void;
  onRetake: () => void;
}) => <motion.div initial={{
  opacity: 0
}} animate={{
  opacity: 1
}} exit={{
  opacity: 0
}} transition={{
  duration: 0.5
}} className="absolute inset-0 z-50 flex flex-col justify-end" style={{
  backgroundColor: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(8px)'
}}>
    {/* Freeze frame indicator */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <motion.div initial={{
      scale: 0.6,
      opacity: 0
    }} animate={{
      scale: 1,
      opacity: 1
    }} transition={{
      delay: 0.1,
      type: 'spring',
      damping: 18,
      stiffness: 200
    }} className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, rgba(74,58,255,0.9) 0%, rgba(137,127,255,0.9) 100%)',
        boxShadow: '0 0 40px rgba(74,58,255,0.4)',
        border: '2px solid rgba(255,255,255,0.3)'
      }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M8 18L15 25L28 11" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-white text-xl font-bold mb-1">스캔 완료</p>
          <p className="text-white/60 text-sm">충분한 데이터를 확보했습니다</p>
        </div>
      </motion.div>
    </div>

    {/* Bottom sheet */}
    <motion.div initial={{
    y: '100%'
  }} animate={{
    y: 0
  }} transition={{
    delay: 0.25,
    type: 'spring',
    damping: 26,
    stiffness: 220
  }} className="rounded-t-[36px] p-6" style={{
    background: 'linear-gradient(180deg, rgba(10,8,30,0.95) 0%, rgba(20,14,50,0.98) 100%)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderBottom: 'none'
  }}>
      <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{
      backgroundColor: 'rgba(255,255,255,0.2)'
    }} />

      {/* Preview strip */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5">
        {FRAME_COLORS.map((gradient, i) => <div key={`preview-${i}`} className={`flex-shrink-0 w-16 h-11 rounded-[8px] bg-gradient-to-br ${gradient} border border-white/10`} style={{
        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 25%, transparent 25%)',
        backgroundSize: '8px 8px'
      }} />)}
      </div>

      <div className="mb-4">
        <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-1">스캔 요약</p>
        <div className="flex gap-4">
          <div>
            <p className="text-white font-bold text-lg">24</p>
            <p className="text-white/40 text-[10px]">프레임</p>
          </div>
          <div>
            <p className="text-white font-bold text-lg">280°</p>
            <p className="text-white/40 text-[10px]">커버리지</p>
          </div>
          <div>
            <p className="text-white font-bold text-lg">Good</p>
            <p className="text-white/40 text-[10px]">품질</p>
          </div>
        </div>
      </div>

      <motion.button whileTap={{
      scale: 0.97
    }} onClick={onConfirm} className="w-full py-4 rounded-[18px] mb-3 font-bold text-white text-base" style={{
      background: 'linear-gradient(135deg, #4A3AFF 0%, #897FFF 100%)',
      boxShadow: '0 8px 24px rgba(74,58,255,0.4)'
    }}>
        3D 생성하기
      </motion.button>
      <motion.button whileTap={{
      scale: 0.97
    }} onClick={onRetake} className="w-full py-3.5 rounded-[18px] font-semibold text-white/60 text-sm" style={{
      border: '1px solid rgba(255,255,255,0.12)'
    }}>
        다시 촬영
      </motion.button>
    </motion.div>
  </motion.div>;

// ─── Camera Grid Overlay ──────────────────────────────────────────────────────

const CameraGrid = ({
  visible
}: {
  visible: boolean;
}) => <div className="absolute inset-0 transition-opacity duration-500" style={{
  opacity: visible ? 0.12 : 0,
  pointerEvents: 'none',
  zIndex: 5
}}>
    {/* Thirds vertical */}
    <div className="absolute inset-y-0 left-1/3 w-px bg-white" />
    <div className="absolute inset-y-0 right-1/3 w-px bg-white" />
    {/* Thirds horizontal */}
    <div className="absolute inset-x-0 top-1/3 h-px bg-white" />
    <div className="absolute inset-x-0 bottom-1/3 h-px bg-white" />
  </div>;

// ─── Scan Steps Indicator ─────────────────────────────────────────────────────

const ScanStepsIndicator = ({
  currentStep
}: {
  currentStep: number;
}) => <div className="flex items-center gap-1.5">
    {SCAN_STEPS.map((step, i) => <div key={step.label} className="flex items-center gap-1">
        <div className="rounded-full transition-all duration-500" style={{
      width: i === currentStep ? '20px' : '6px',
      height: '6px',
      backgroundColor: i < currentStep ? 'rgba(99,102,241,1)' : i === currentStep ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)'
    }} />
      </div>)}
  </div>;

// ─── Main Component ───────────────────────────────────────────────────────────

export const PanoramaCameraScreen = ({
  onProcess,
  onBack,
  mode = 'room'
}: PanoramaCameraScreenProps) => {
  const [scanPhase, setScanPhase] = useState<ScanPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState(0);
  const [warning, setWarning] = useState<WarningType>(null);
  const [tilt, setTilt] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showInstruction, setShowInstruction] = useState(true);
  const [showModeSelector, setShowModeSelector] = useState(true);
  const [selectedCameraMode, setSelectedCameraMode] = useState<'panorama' | 'video' | 'photo'>('panorama');
  const progressRef = useRef(progress);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningSeqRef = useRef(0);
  progressRef.current = progress;
  const modeConfig = MODE_LABELS[mode];

  // Simulate tilt oscillation
  useEffect(() => {
    if (scanPhase !== 'scanning') {
      setTilt(0);
      return;
    }
    const interval = setInterval(() => {
      setTilt(Math.sin(Date.now() / 800) * 4);
    }, 80);
    return () => clearInterval(interval);
  }, [scanPhase]);

  // Progress + frame capture simulation
  useEffect(() => {
    if (scanPhase !== 'scanning') return;
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 0.65;
        if (next >= 100) {
          setScanPhase('complete');
          return 100;
        }
        return next;
      });
      setCapturedFrames(prev => prev + 1);
    }, 100);
    return () => clearInterval(interval);
  }, [scanPhase]);

  // Step advancement
  useEffect(() => {
    if (scanPhase !== 'scanning') return;
    const step = Math.floor(progress / 100 * SCAN_STEPS.length);
    setCurrentStep(Math.min(step, SCAN_STEPS.length - 1));
  }, [progress, scanPhase]);

  // Warning simulation
  useEffect(() => {
    if (scanPhase !== 'scanning') {
      setWarning(null);
      return;
    }
    const warningTypes: WarningType[] = ['tooFast', 'notLevel', 'offPath'];
    let idx = 0;
    const scheduleNext = () => {
      const delay = 3500 + Math.random() * 4000;
      warningTimerRef.current = setTimeout(() => {
        const w = warningTypes[idx % warningTypes.length];
        idx++;
        setWarning(w);
        setTimeout(() => setWarning(null), 2000);
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [scanPhase]);

  // Instruction fade
  useEffect(() => {
    if (scanPhase === 'scanning') {
      const t = setTimeout(() => setShowInstruction(false), 3500);
      return () => clearTimeout(t);
    } else {
      setShowInstruction(true);
    }
  }, [scanPhase]);
  const handleStartStop = useCallback(() => {
    if (scanPhase === 'idle') {
      setProgress(0);
      setCapturedFrames(0);
      setCurrentStep(0);
      setScanPhase('scanning');
      setShowModeSelector(false);
    } else if (scanPhase === 'scanning') {
      setScanPhase('complete');
    }
  }, [scanPhase]);
  const handleRetake = () => {
    setScanPhase('idle');
    setProgress(0);
    setCapturedFrames(0);
    setCurrentStep(0);
    setWarning(null);
    setShowModeSelector(true);
  };
  const isScanning = scanPhase === 'scanning';
  const CAMERA_MODE_TABS = [{
    id: 'video' as const,
    label: '동영상'
  }, {
    id: 'photo' as const,
    label: '사진'
  }, {
    id: 'panorama' as const,
    label: '파노라마'
  }];
  return <motion.div initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} exit={{
    opacity: 0
  }} transition={{
    duration: 0.35
  }} className="absolute inset-0 overflow-hidden" style={{
    backgroundColor: '#050508',
    zIndex: 40
  }}>
      {/* ── Simulated camera background ── */}
      <div className="absolute inset-0" style={{
      background: 'radial-gradient(ellipse at 30% 45%, rgba(30,24,70,0.95) 0%, rgba(8,6,18,0.98) 60%, rgba(4,3,10,1) 100%)'
    }} />
      {/* Subtle room texture simulation */}
      <div className="absolute inset-0 opacity-20" style={{
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
      backgroundSize: '48px 48px'
    }} />
      {/* Vignette */}
      <div className="absolute inset-0" style={{
      background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)',
      pointerEvents: 'none'
    }} />

      {/* ── Camera grid ── */}
      <CameraGrid visible={isScanning} />

      {/* ── Horizontal alignment guide ── */}
      <AlignmentGuide isScanning={isScanning} tilt={tilt} />

      {/* ── Scan complete overlay ── */}
      <AnimatePresence>
        {scanPhase === 'complete' && <ScanCompleteOverlay onConfirm={onProcess} onRetake={handleRetake} />}
      </AnimatePresence>

      {/* ═══════════════ TOP BAR ═══════════════ */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between px-5 z-20" style={{
      paddingTop: '52px'
    }}>
        {/* Back button */}
        <motion.button whileTap={{
        scale: 0.88
      }} onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center" style={{
        backgroundColor: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.12)'
      }}>
          <ChevronLeft size={20} color="white" />
        </motion.button>

        {/* Title + status pill */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full" style={{
          backgroundColor: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
            <motion.div animate={isScanning ? {
            opacity: [1, 0.2, 1]
          } : {
            opacity: 0.4
          }} transition={{
            duration: 1,
            repeat: Infinity
          }} className="w-2 h-2 rounded-full" style={{
            backgroundColor: isScanning ? 'rgb(239,68,68)' : 'rgba(255,255,255,0.4)'
          }} />
            <span className="text-white font-semibold text-[12px]">
              {isScanning ? mode === 'room' ? '공간 스캔 중' : '가구 스캔 중' : modeConfig.title}
            </span>
          </div>

          {/* Step indicator */}
          <AnimatePresence>
            {isScanning && <motion.div initial={{
            opacity: 0,
            y: -6
          }} animate={{
            opacity: 1,
            y: 0
          }} exit={{
            opacity: 0,
            y: -6
          }}>
                <ScanStepsIndicator currentStep={currentStep} />
              </motion.div>}
          </AnimatePresence>
        </div>

        {/* Flash / settings button */}
        <motion.button whileTap={{
        scale: 0.88
      }} className="w-10 h-10 rounded-full flex items-center justify-center" style={{
        backgroundColor: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.12)'
      }}>
          <Zap size={16} color="rgba(255,255,255,0.7)" />
        </motion.button>
      </div>

      {/* ═══════════════ WARNING TOAST ═══════════════ */}
      <div className="absolute left-0 right-0 flex justify-center z-30" style={{
      top: '128px',
      pointerEvents: 'none'
    }}>
        <WarningToast warning={warning} />
      </div>

      {/* ═══════════════ INSTRUCTION OVERLAY ═══════════════ */}
      <div className="absolute left-0 right-0 flex flex-col items-center gap-2 z-20" style={{
      top: '22%',
      pointerEvents: 'none'
    }}>
        <AnimatePresence>
          {showInstruction && <motion.div initial={{
          opacity: 0,
          y: 8
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: -8
        }} transition={{
          duration: 0.6
        }} className="flex flex-col items-center gap-1.5">
              <div className="px-5 py-2.5 rounded-[14px]" style={{
            backgroundColor: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
                <p className="text-white font-semibold text-[13px] text-center">{modeConfig.instruction}</p>
              </div>
              <p className="text-white/40 text-[11px] font-medium">{modeConfig.subInstruction}</p>
            </motion.div>}
        </AnimatePresence>

        {/* Motion direction arrow */}
        <div className="mt-2">
          <MotionArrow isScanning={isScanning} mode={mode} />
        </div>
      </div>

      {/* ═══════════════ SIDE FRAME PREVIEW ═══════════════ */}
      <div className="absolute right-4 top-1/2 z-20" style={{
      transform: 'translateY(-40%)'
    }}>
        <FramePreviewStrip capturedFrames={Math.min(capturedFrames, 5)} isScanning={isScanning} />
      </div>

      {/* ═══════════════ BOTTOM CONTROLS ═══════════════ */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col z-20" style={{
      paddingBottom: '36px'
    }}>
        {/* Progress row */}
        <div className="px-6 mb-4">
          <AnimatePresence>
            {(isScanning || progress > 0) && <motion.div initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} exit={{
            opacity: 0,
            y: 10
          }}>
                <ScanProgressBar progress={progress} isScanning={isScanning} />
              </motion.div>}
          </AnimatePresence>
        </div>

        {/* Main control row */}
        <div className="px-8 flex items-center justify-between mb-5">
          {/* Retake button */}
          <motion.button whileTap={{
          scale: 0.9
        }} onClick={handleRetake} className="w-12 h-12 rounded-full flex items-center justify-center" style={{
          backgroundColor: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          opacity: isScanning || progress > 0 ? 1 : 0,
          pointerEvents: isScanning || progress > 0 ? 'auto' : 'none'
        }}>
            <RotateCcw size={18} color="rgba(255,255,255,0.7)" />
          </motion.button>

          {/* Main shutter button */}
          <motion.button whileTap={{
          scale: 0.94
        }} onClick={handleStartStop} className="relative flex items-center justify-center" style={{
          width: '76px',
          height: '76px'
        }}>
            {/* Outer ring */}
            <motion.div animate={isScanning ? {
            rotate: 360
          } : {
            rotate: 0
          }} transition={isScanning ? {
            duration: 4,
            repeat: Infinity,
            ease: 'linear'
          } : {}} className="absolute inset-0 rounded-full" style={{
            border: isScanning ? '2.5px solid transparent' : '2.5px solid rgba(255,255,255,0.5)',
            backgroundImage: isScanning ? 'linear-gradient(rgba(4,3,10,1), rgba(4,3,10,1)), linear-gradient(135deg, #4A3AFF, transparent 50%, #897FFF)' : 'none',
            backgroundOrigin: 'border-box',
            backgroundClip: isScanning ? 'padding-box, border-box' : 'border-box'
          }} />
            {/* Inner button */}
            <div className="w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all duration-300" style={{
            background: isScanning ? 'linear-gradient(135deg, #4A3AFF 0%, #897FFF 100%)' : 'rgba(255,255,255,0.9)',
            boxShadow: isScanning ? '0 0 24px rgba(74,58,255,0.5)' : '0 2px 12px rgba(0,0,0,0.4)'
          }}>
              {isScanning ? <div className="w-5 h-5 rounded-[4px] bg-white" /> : <div className="w-5 h-5 rounded-full" style={{
              background: 'linear-gradient(135deg, #4A3AFF 0%, #897FFF 100%)'
            }} />}
            </div>
          </motion.button>

          {/* Right side placeholder / info */}
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
          backgroundColor: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-white font-bold text-[11px]">{Math.min(capturedFrames, 99)}</span>
              <span className="text-white/30 text-[8px] leading-none">프레임</span>
            </div>
          </div>
        </div>

        {/* Mode selector row */}
        <AnimatePresence>
          {showModeSelector && <motion.div initial={{
          opacity: 0,
          y: 12
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: 12
        }} className="flex items-center justify-center gap-1 px-6">
              {CAMERA_MODE_TABS.map(tab => <motion.button key={tab.id} whileTap={{
            scale: 0.92
          }} onClick={() => setSelectedCameraMode(tab.id)} className="px-4 py-1.5 rounded-full transition-all duration-300" style={{
            backgroundColor: selectedCameraMode === tab.id ? 'rgba(255,255,255,0.15)' : 'transparent',
            backdropFilter: selectedCameraMode === tab.id ? 'blur(12px)' : 'none'
          }}>
                  <span className="text-[12px] font-semibold transition-colors duration-300" style={{
              color: selectedCameraMode === tab.id ? tab.id === 'panorama' ? 'rgb(167,139,250)' : 'white' : 'rgba(255,255,255,0.35)'
            }}>
                    {tab.label}
                  </span>
                </motion.button>)}
            </motion.div>}
        </AnimatePresence>
      </div>

      {/* ── Corner scan guides (visible always, animate when scanning) ── */}
      <div className="absolute inset-0 pointer-events-none z-10" style={{
      padding: '18%'
    }}>
        {/* Top-left */}
        <motion.div animate={isScanning ? {
        opacity: [0.4, 0.9, 0.4]
      } : {
        opacity: 0.25
      }} transition={{
        duration: 2,
        repeat: Infinity,
        delay: 0
      }} className="absolute top-0 left-0 w-8 h-8" style={{
        top: '18%',
        left: '8%'
      }}>
          <div className="absolute top-0 left-0 w-6 h-[2px] rounded-full bg-white" />
          <div className="absolute top-0 left-0 w-[2px] h-6 rounded-full bg-white" />
        </motion.div>
        {/* Top-right */}
        <motion.div animate={isScanning ? {
        opacity: [0.4, 0.9, 0.4]
      } : {
        opacity: 0.25
      }} transition={{
        duration: 2,
        repeat: Infinity,
        delay: 0.5
      }} className="absolute" style={{
        top: '18%',
        right: '8%'
      }}>
          <div className="absolute top-0 right-0 w-6 h-[2px] rounded-full bg-white" />
          <div className="absolute top-0 right-0 w-[2px] h-6 rounded-full bg-white" />
        </motion.div>
        {/* Bottom-left */}
        <motion.div animate={isScanning ? {
        opacity: [0.4, 0.9, 0.4]
      } : {
        opacity: 0.25
      }} transition={{
        duration: 2,
        repeat: Infinity,
        delay: 1.0
      }} className="absolute" style={{
        bottom: '18%',
        left: '8%'
      }}>
          <div className="absolute bottom-0 left-0 w-6 h-[2px] rounded-full bg-white" />
          <div className="absolute bottom-0 left-0 w-[2px] h-6 rounded-full bg-white" />
        </motion.div>
        {/* Bottom-right */}
        <motion.div animate={isScanning ? {
        opacity: [0.4, 0.9, 0.4]
      } : {
        opacity: 0.25
      }} transition={{
        duration: 2,
        repeat: Infinity,
        delay: 1.5
      }} className="absolute" style={{
        bottom: '18%',
        right: '8%'
      }}>
          <div className="absolute bottom-0 right-0 w-6 h-[2px] rounded-full bg-white" />
          <div className="absolute bottom-0 right-0 w-[2px] h-6 rounded-full bg-white" />
        </motion.div>
      </div>

      {/* ── Scan line sweep (active only when scanning) ── */}
      <AnimatePresence>
        {isScanning && <motion.div key="scanline" initial={{
        x: '-100%'
      }} animate={{
        x: '100%'
      }} exit={{
        opacity: 0
      }} transition={{
        duration: 2.8,
        repeat: Infinity,
        ease: 'linear',
        repeatDelay: 0.5
      }} className="absolute inset-y-0 pointer-events-none z-10" style={{
        width: '2px',
        background: 'linear-gradient(to bottom, transparent 0%, rgba(99,102,241,0.7) 40%, rgba(139,92,246,0.9) 50%, rgba(99,102,241,0.7) 60%, transparent 100%)',
        boxShadow: '0 0 12px 3px rgba(99,102,241,0.3)'
      }} />}
      </AnimatePresence>
    </motion.div>;
};
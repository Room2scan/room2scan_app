import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Text } from '../components/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Rect, G } from 'react-native-svg';

type ReconstructionPhase = 'frames' | 'pointcloud' | 'mesh' | 'structure' | 'complete';

interface PhaseConfig {
  label: string;
  sublabel: string;
  duration: number;
  progressTarget: number;
}

const PHASES: Record<ReconstructionPhase, PhaseConfig> = {
  frames:     { label: '프레임 분석 중',    sublabel: '캡처된 이미지를 처리하는 중...',  duration: 1400, progressTarget: 20  },
  pointcloud: { label: '포인트 클라우드 생성', sublabel: '공간 좌표를 계산하는 중...',       duration: 1600, progressTarget: 50  },
  mesh:       { label: '메쉬 재구성 중',     sublabel: '표면 구조를 연결하는 중...',       duration: 1500, progressTarget: 75  },
  structure:  { label: '공간 구조 완성',     sublabel: '벽, 바닥, 천장을 인식하는 중...',  duration: 1200, progressTarget: 92  },
  complete:   { label: '완성!',            sublabel: '3D 공간이 생성되었습니다',          duration: 800,  progressTarget: 100 },
};
const PHASE_ORDER: ReconstructionPhase[] = ['frames', 'pointcloud', 'mesh', 'structure', 'complete'];

// ─── Point Cloud Viz ─────────────────────────────────────────────────────────────
const POINT_DATA = Array.from({ length: 52 }, (_, i) => {
  const angle = (i / 52) * Math.PI * 2;
  const radius = 50 + Math.sin(i * 2.4) * 28 + Math.cos(i * 1.7) * 20;
  return {
    id: i,
    cx: 96 + Math.cos(angle) * radius,
    cy: 96 + Math.sin(angle) * radius * 0.6,
    r: 1.5 + (i % 3) * 0.8,
    color: ['rgba(99,102,241,0.9)', 'rgba(139,92,246,0.7)', 'rgba(167,139,250,0.6)', 'rgba(196,181,253,0.4)'][i % 4],
  };
});

const PhaseViz = ({ phase }: { phase: ReconstructionPhase }) => {
  if (phase === 'frames') {
    const configs = [
      { x: -120, y: -60, rotate: -12, scale: 0.82 },
      { x: -60, y: -90, rotate: 4, scale: 0.9 },
      { x: 10, y: -80, rotate: -3, scale: 0.95 },
      { x: 75, y: -65, rotate: 8, scale: 0.87 },
      { x: 125, y: -45, rotate: -6, scale: 0.78 },
    ];
    return (
      <View style={styles.vizContainer}>
        {configs.map((cfg, i) => (
          <LinearGradient
            key={i}
            colors={['rgba(67,56,202,0.8)', 'rgba(88,28,135,0.8)']}
            style={[
              styles.floatFrame,
              {
                transform: [
                  { translateX: cfg.x },
                  { translateY: cfg.y },
                  { rotate: `${cfg.rotate}deg` },
                  { scale: cfg.scale },
                ],
              },
            ]}
          />
        ))}
      </View>
    );
  }

  if (phase === 'pointcloud') {
    return (
      <View style={styles.vizContainer}>
        <Svg width={192} height={192} viewBox="0 0 192 192">
          {POINT_DATA.slice(0, 20).map((pt, i) => {
            const next = POINT_DATA[(i + 3) % POINT_DATA.length];
            return (
              <Line key={`l-${pt.id}`}
                x1={pt.cx} y1={pt.cy} x2={next.cx} y2={next.cy}
                stroke="rgba(99,102,241,0.15)" strokeWidth="0.8" />
            );
          })}
          {POINT_DATA.map(pt => (
            <Circle key={pt.id} cx={pt.cx} cy={pt.cy} r={pt.r} fill={pt.color} />
          ))}
        </Svg>
      </View>
    );
  }

  if (phase === 'mesh') {
    const rows = 7; const cols = 10;
    return (
      <View style={styles.vizContainer}>
        <Svg width={192} height={192} viewBox="0 0 192 192">
          {Array.from({ length: rows }, (_, row) =>
            Array.from({ length: cols }, (_, col) => {
              const x1 = 16 + col * 16, y1 = 80 + row * 12 + col * 1.5;
              return <Line key={`h-${row}-${col}`} x1={x1} y1={y1} x2={x1 + 16} y2={y1 + 1.5} stroke="rgba(99,102,241,0.5)" strokeWidth="0.8" />;
            })
          )}
          {Array.from({ length: 4 }, (_, row) =>
            Array.from({ length: cols }, (_, col) => {
              const x1 = 16 + col * 16, y1 = 24 + row * 14;
              return <Line key={`w-${row}-${col}`} x1={x1} y1={y1} x2={x1 + 16} y2={y1} stroke="rgba(139,92,246,0.35)" strokeWidth="0.7" />;
            })
          )}
          {Array.from({ length: cols + 1 }, (_, col) => (
            <Line key={`v-${col}`} x1={16 + col * 16} y1={24} x2={16 + col * 16} y2={80} stroke="rgba(167,139,250,0.25)" strokeWidth="0.7" />
          ))}
        </Svg>
      </View>
    );
  }

  // structure / complete
  return (
    <View style={styles.vizContainer}>
      <Svg width={192} height={192} viewBox="0 0 192 192">
        <Rect x={16} y={80} width={160} height={96} rx={2} fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.4)" strokeWidth={1} />
        <Rect x={16} y={24} width={160} height={56} rx={2} fill="rgba(139,92,246,0.08)" stroke="rgba(139,92,246,0.35)" strokeWidth={1} />
        <Rect x={16} y={24} width={20} height={152} rx={2} fill="rgba(167,139,250,0.06)" stroke="rgba(167,139,250,0.25)" strokeWidth={0.8} />
        <Rect x={40} y={110} width={48} height={28} rx={4} fill="rgba(99,102,241,0.2)" stroke="rgba(99,102,241,0.5)" strokeWidth={1} />
        <Rect x={110} y={90} width={32} height={48} rx={4} fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.4)" strokeWidth={1} />
        {Array.from({ length: 6 }, (_, i) => (
          <Line key={`g-${i}`} x1={16} y1={80 + i * 16} x2={176} y2={80 + i * 16} stroke="rgba(99,102,241,0.08)" strokeWidth={0.5} />
        ))}
      </Svg>
    </View>
  );
};

const ProgressSteps = ({ currentPhase }: { currentPhase: ReconstructionPhase }) => {
  const stepIndex = PHASE_ORDER.indexOf(currentPhase);
  const steps = [
    { phase: 'frames' as const, label: '프레임' },
    { phase: 'pointcloud' as const, label: '포인트' },
    { phase: 'mesh' as const, label: '메쉬' },
    { phase: 'structure' as const, label: '공간' },
    { phase: 'complete' as const, label: '완성' },
  ];
  return (
    <View style={styles.stepsRow}>
      {steps.map((step, i) => {
        const done = PHASE_ORDER.indexOf(step.phase) < stepIndex;
        const active = step.phase === currentPhase;
        return (
          <View key={step.phase} style={styles.stepItem}>
            <View style={styles.stepInner}>
              <View style={[
                styles.stepDot,
                {
                  width: active ? 8 : 6,
                  height: active ? 8 : 6,
                  backgroundColor: done ? 'rgb(99,102,241)' : active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
                },
              ]} />
              <Text style={[styles.stepLabel, {
                color: done ? 'rgb(99,102,241)' : active ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)',
              }]}>{step.label}</Text>
            </View>
            {i < steps.length - 1 && (
              <View style={[styles.stepLine, { backgroundColor: done ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.1)' }]} />
            )}
          </View>
        );
      })}
    </View>
  );
};

interface ReconstructionScreenProps {
  onComplete: () => void;
}

export const ReconstructionScreen = ({ onComplete }: ReconstructionScreenProps) => {
  const [currentPhase, setCurrentPhase] = useState<ReconstructionPhase>('frames');
  const [progress, setProgress] = useState(0);
  const phaseIndexRef = useRef(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const orbitAnim = useRef(new Animated.Value(0)).current;

  // Glow pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.6, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Orbit ring
  useEffect(() => {
    Animated.loop(
      Animated.timing(orbitAnim, { toValue: 1, duration: 10000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  const orbitRotate = orbitAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // Phase progression
  useEffect(() => {
    const totalDuration = PHASE_ORDER.reduce((sum, p) => sum + PHASES[p].duration, 0);
    const startTime = Date.now();

    const progressInterval = setInterval(() => {
      const t = Date.now() - startTime;
      const p = Math.min((t / totalDuration) * 100, 99);
      setProgress(p);
      Animated.timing(progressAnim, { toValue: p / 100, duration: 150, useNativeDriver: false }).start();
    }, 60);

    const advancePhase = (idx: number) => {
      if (idx >= PHASE_ORDER.length - 1) {
        setProgress(100);
        Animated.timing(progressAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();
        setCurrentPhase('complete');
        setTimeout(onComplete, 900);
        return;
      }
      const phase = PHASE_ORDER[idx];
      setTimeout(() => {
        setCurrentPhase(PHASE_ORDER[idx + 1]);
        phaseIndexRef.current = idx + 1;
        advancePhase(idx + 1);
      }, PHASES[phase].duration);
    };

    advancePhase(0);
    return () => clearInterval(progressInterval);
  }, []);

  const config = PHASES[currentPhase];
  const progressBarWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.container}>
      {/* Background glow */}
      <Animated.View style={[styles.bgGlow, { opacity: glowAnim }]} />

      {/* Dot pattern */}
      <View style={styles.dotPattern} />

      <View style={styles.content}>
        {/* Visualization */}
        <View style={styles.vizWrapper}>
          <PhaseViz phase={currentPhase} />
          {/* Orbit ring */}
          <Animated.View style={[styles.orbitRing, { transform: [{ rotate: orbitRotate }] }]} />
        </View>

        {/* Phase label */}
        <View style={styles.textBlock}>
          <Text style={styles.phaseLabel}>{config.label}</Text>
          <Text style={styles.phaseSublabel}>{config.sublabel}</Text>
        </View>

        {/* Steps */}
        <ProgressSteps currentPhase={currentPhase} />

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressBarWidth }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressHint}>공간을 재구성하는 중…</Text>
            <Text style={styles.progressPct}>{Math.round(progress)}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#060510', zIndex: 50,
  },
  bgGlow: {
    position: 'absolute', top: '20%', left: '15%', right: '15%', height: '40%',
    borderRadius: 999,
    backgroundColor: 'rgba(74,58,255,0.18)',
  },
  dotPattern: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.05,
  },
  content: { width: '100%', maxWidth: 320, alignItems: 'center', gap: 32, paddingHorizontal: 32 },
  vizWrapper: { width: 192, height: 192, alignItems: 'center', justifyContent: 'center' },
  vizContainer: { width: 192, height: 192, alignItems: 'center', justifyContent: 'center' },
  floatFrame: {
    position: 'absolute', width: 64, height: 44,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  orbitRing: {
    position: 'absolute', width: 192, height: 192,
    borderRadius: 96, borderWidth: 1.5, borderColor: 'rgba(99,102,241,0.2)',
    borderStyle: 'dashed',
  },
  textBlock: { alignItems: 'center', gap: 6 },
  phaseLabel: { color: '#fff', fontWeight: '700', fontSize: 20 },
  phaseSublabel: { color: 'rgba(255,255,255,0.40)', fontSize: 13 },
  stepsRow: { flexDirection: 'row', alignItems: 'center' },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepInner: { alignItems: 'center', gap: 4 },
  stepDot: { borderRadius: 4 },
  stepLabel: { fontSize: 8, fontWeight: '600' },
  stepLine: { width: 20, height: 1, marginHorizontal: 4, marginBottom: 12 },
  progressSection: { width: '100%', gap: 8 },
  progressTrack: {
    width: '100%', height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 2,
    backgroundColor: '#897FFF',
    shadowColor: '#4A3AFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 6,
  },
  progressLabels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressHint: { color: 'rgba(255,255,255,0.25)', fontSize: 10 },
  progressPct: { color: 'rgba(255,255,255,0.50)', fontSize: 11, fontWeight: '700' },
});

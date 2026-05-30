import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

type ScanPhase = 'idle' | 'scanning' | 'complete';
type WarningType = 'tooFast' | 'offPath' | 'notLevel' | null;
type CameraMode = 'room' | 'furniture';

interface PanoramaCameraScreenProps {
  onProcess: () => void;
  onBack: () => void;
  mode?: CameraMode;
}

const SCAN_STEPS = ['왼쪽 벽', '중앙', '오른쪽 벽', '천장'];
const FRAME_COLORS: [string, string][] = [
  ['rgba(67,56,202,0.8)', 'rgba(88,28,135,0.8)'],
  ['rgba(30,27,75,0.8)', 'rgba(67,56,202,0.8)'],
  ['rgba(88,28,135,0.8)', 'rgba(15,23,42,0.8)'],
  ['rgba(55,48,163,0.8)', 'rgba(88,28,135,0.8)'],
  ['rgba(15,23,42,0.8)', 'rgba(88,28,135,0.8)'],
];
const WARNING_MESSAGES: Record<NonNullable<WarningType>, { text: string; color: string }> = {
  tooFast: { text: '속도가 너무 빠릅니다', color: 'rgb(239,68,68)' },
  offPath: { text: '경로를 벗어났습니다', color: 'rgb(245,158,11)' },
  notLevel: { text: '카메라를 수평으로 유지하세요', color: 'rgb(245,158,11)' },
};
const MODE_LABELS: Record<CameraMode, { title: string; instruction: string; subInstruction: string }> = {
  room: { title: '방 스캔', instruction: '천천히, 일정한 속도로 움직이세요', subInstruction: '왼쪽에서 오른쪽으로 부드럽게 이동' },
  furniture: { title: '가구 스캔', instruction: '가구 주변을 천천히 돌며 촬영하세요', subInstruction: '360° 전체가 포착되도록' },
};

export const PanoramaCameraScreen = ({
  onProcess,
  onBack,
  mode = 'room',
}: PanoramaCameraScreenProps) => {
  const insets = useSafeAreaInsets();
  const [scanPhase, setScanPhase] = useState<ScanPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState(0);
  const [warning, setWarning] = useState<WarningType>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const warningOpacity = useRef(new Animated.Value(0)).current;

  const modeConfig = MODE_LABELS[mode];

  // ── Camera permissions ──────────────────────────────────────────────────
  const [permission, requestPermission] = useCameraPermissions();
  const cameraReady = permission?.granted ?? false;

  // Pulse animation for scan button
  useEffect(() => {
    if (scanPhase === 'scanning') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [scanPhase]);

  // Progress simulation
  useEffect(() => {
    if (scanPhase !== 'scanning') return;
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 0.65;
        if (next >= 100) {
          setScanPhase('complete');
          setShowComplete(true);
          clearInterval(interval);
          return 100;
        }
        return next;
      });
      setCapturedFrames(prev => prev + 1);
    }, 100);
    return () => clearInterval(interval);
  }, [scanPhase]);

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress / 100,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Step advancement
  useEffect(() => {
    if (scanPhase !== 'scanning') return;
    const step = Math.floor((progress / 100) * SCAN_STEPS.length);
    setCurrentStep(Math.min(step, SCAN_STEPS.length - 1));
  }, [progress, scanPhase]);

  // Warning simulation
  useEffect(() => {
    if (scanPhase !== 'scanning') { setWarning(null); return; }
    const warningTypes: WarningType[] = ['tooFast', 'notLevel', 'offPath'];
    let idx = 0;
    const scheduleNext = () => {
      const delay = 3500 + Math.random() * 4000;
      const t = setTimeout(() => {
        const w = warningTypes[idx % warningTypes.length];
        idx++;
        setWarning(w);
        Animated.sequence([
          Animated.timing(warningOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.delay(1800),
          Animated.timing(warningOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => setWarning(null));
        scheduleNext();
      }, delay);
      return t;
    };
    const t = scheduleNext();
    return () => clearTimeout(t);
  }, [scanPhase]);

  const handleStartScan = () => {
    setProgress(0);
    setCapturedFrames(0);
    setCurrentStep(0);
    setScanPhase('scanning');
  };

  const handleReset = () => {
    setScanPhase('idle');
    setProgress(0);
    setCapturedFrames(0);
    setCurrentStep(0);
    setShowComplete(false);
  };

  const progressBarWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  // ── Permission gate ─────────────────────────────────────────────────────
  if (!permission) {
    // Loading permissions
    return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: '#fff' }}>카메라 권한 확인 중...</Text>
    </View>;
  }
  if (!permission.granted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }]}>
        <Feather name="camera-off" size={48} color="#fff" style={{ marginBottom: 20 }} />
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' }}>
          카메라 권한이 필요해요
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', marginBottom: 28 }}>
          방 스캔 및 가구 촬영을 위해 카메라 접근 권한을 허용해주세요.
        </Text>
        <TouchableOpacity onPress={requestPermission} activeOpacity={0.85}
          style={{ backgroundColor: '#4A3AFF', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>권한 허용</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>뒤로 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Real camera viewfinder (expo-camera) */}
      <View style={styles.viewfinder}>
        {cameraReady ? (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing={'back' as CameraType}
          />
        ) : (
          <LinearGradient
            colors={['rgba(10,8,40,1)', 'rgba(20,14,60,1)']}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        {/* Ambient glow overlay (semi-transparent so camera shows through) */}
        {!cameraReady && <View style={styles.ambientGlow} />}
        {/* Grid overlay */}
        {scanPhase === 'scanning' && (
          <View style={[StyleSheet.absoluteFillObject, styles.gridOverlay]} pointerEvents="none">
            <View style={styles.gridV1} />
            <View style={styles.gridV2} />
            <View style={styles.gridH1} />
            <View style={styles.gridH2} />
          </View>
        )}
      </View>

      {/* Top controls */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
          <Feather name="chevron-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{modeConfig.title}</Text>
        </View>
        <View style={styles.topRight}>
          {/* Frame counter */}
          <View style={styles.frameCounter}>
            <Text style={styles.frameCounterText}>캡처됨 {capturedFrames}</Text>
          </View>
        </View>
      </View>

      {/* Warning toast */}
      {warning && (
        <Animated.View style={[styles.warningToast, { opacity: warningOpacity, borderColor: `${WARNING_MESSAGES[warning].color}55`, backgroundColor: `${WARNING_MESSAGES[warning].color}22` }]}>
          <Feather name="alert-triangle" size={13} color={WARNING_MESSAGES[warning].color} />
          <Text style={styles.warningText}>{WARNING_MESSAGES[warning].text}</Text>
        </Animated.View>
      )}

      {/* Center alignment guide */}
      <View style={styles.alignGuide} pointerEvents="none">
        <View style={[styles.alignLine, { right: undefined, width: 24 }]} />
        <View style={[styles.alignDot, { backgroundColor: scanPhase === 'scanning' ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.18)' }]} />
        <View style={[styles.alignLine, { left: undefined, right: 16, width: 24 }]} />
      </View>

      {/* Scan steps */}
      {scanPhase !== 'idle' && (
        <View style={styles.scanSteps}>
          {SCAN_STEPS.map((step, i) => (
            <View key={step} style={styles.scanStep}>
              <Animated.View style={[
                styles.scanStepDot,
                {
                  backgroundColor: i < currentStep ? 'rgb(99,102,241)' : i === currentStep ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
                  width: i === currentStep ? 8 : 6,
                  height: i === currentStep ? 8 : 6,
                },
              ]} />
              <Text style={[styles.scanStepLabel, {
                color: i < currentStep ? 'rgb(99,102,241)' : i === currentStep ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)',
              }]}>{step}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Frame preview strip */}
      {capturedFrames > 0 && (
        <View style={[styles.frameStrip, { top: insets.top + 80 }]}>
          {FRAME_COLORS.slice(0, Math.min(capturedFrames, 5)).map((colors, i) => (
            <LinearGradient key={i} colors={colors} style={styles.frameThumb} />
          ))}
          {scanPhase === 'scanning' && (
            <View style={styles.frameStripIndicator} />
          )}
        </View>
      )}

      {/* Bottom controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 40 }]}>
        {/* Progress bar */}
        {scanPhase !== 'idle' && (
          <View style={styles.progressWrap}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>{scanPhase === 'scanning' ? '스캔 진행' : '완료'}</Text>
              <Text style={styles.progressPct}>{Math.round(progress)}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressBarWidth }]} />
            </View>
          </View>
        )}

        {/* Instruction text */}
        {scanPhase === 'idle' && (
          <View style={styles.instructionWrap}>
            <Text style={styles.instruction}>{modeConfig.instruction}</Text>
            <Text style={styles.subInstruction}>{modeConfig.subInstruction}</Text>
          </View>
        )}

        {/* Camera button */}
        <View style={styles.cameraRow}>
          {scanPhase !== 'idle' && (
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn} activeOpacity={0.8}>
              <Feather name="rotate-ccw" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              onPress={scanPhase === 'idle' ? handleStartScan : undefined}
              activeOpacity={scanPhase === 'idle' ? 0.85 : 1}
              style={[styles.captureBtn, scanPhase === 'scanning' && styles.captureBtnActive]}
            >
              {scanPhase === 'scanning' ? (
                <View style={styles.captureBtnInner}>
                  <Feather name="zap" size={24} color="#fff" />
                </View>
              ) : (
                <View style={styles.captureBtnInner} />
              )}
            </TouchableOpacity>
          </Animated.View>
          <View style={{ width: 48 }} />
        </View>
      </View>

      {/* Scan complete overlay */}
      <Modal visible={showComplete} transparent animationType="fade">
        <View style={styles.completeOverlay}>
          <View style={styles.completeContent}>
            <LinearGradient
              colors={['rgba(74,58,255,0.9)', 'rgba(137,127,255,0.9)']}
              style={styles.completeIcon}
            >
              <Feather name="check" size={36} color="#fff" />
            </LinearGradient>
            <Text style={styles.completeTitle}>스캔 완료</Text>
            <Text style={styles.completeSub}>충분한 데이터를 확보했습니다</Text>
          </View>

          {/* Bottom sheet */}
          <View style={[styles.completeSheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.completeSheetHandle} />
            {/* Preview strip */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewStrip} contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}>
              {FRAME_COLORS.map((colors, i) => (
                <LinearGradient key={i} colors={colors} style={styles.previewFrame} />
              ))}
            </ScrollView>
            {/* Summary */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>24</Text>
                <Text style={styles.summarySub}>프레임</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>280°</Text>
                <Text style={styles.summarySub}>커버리지</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>Good</Text>
                <Text style={styles.summarySub}>품질</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onProcess} style={styles.processBtn} activeOpacity={0.9}>
              <LinearGradient colors={['#4A3AFF', '#897FFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.processBtnInner}>
                <Text style={styles.processBtnText}>3D 생성하기</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReset} style={styles.retakeBtn} activeOpacity={0.8}>
              <Text style={styles.retakeBtnText}>다시 촬영</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060510' },
  viewfinder: { ...StyleSheet.absoluteFillObject },
  ambientGlow: {
    position: 'absolute', top: '20%', left: '10%', right: '10%', height: '40%',
    borderRadius: 999,
    backgroundColor: 'rgba(74,58,255,0.08)',
  },
  gridOverlay: { opacity: 0.12 },
  gridV1: { position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: 1, backgroundColor: '#fff' },
  gridV2: { position: 'absolute', right: '33.33%', top: 0, bottom: 0, width: 1, backgroundColor: '#fff' },
  gridH1: { position: 'absolute', top: '33.33%', left: 0, right: 0, height: 1, backgroundColor: '#fff' },
  gridH2: { position: 'absolute', bottom: '33.33%', left: 0, right: 0, height: 1, backgroundColor: '#fff' },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { color: '#fff', fontWeight: '700', fontSize: 16 },
  topRight: { width: 80, alignItems: 'flex-end' },
  frameCounter: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  frameCounterText: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' },
  warningToast: {
    position: 'absolute', top: '12%', alignSelf: 'center', zIndex: 30,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1,
  },
  warningText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  alignGuide: {
    position: 'absolute', top: '42%', left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  alignLine: { height: 2, width: 24, backgroundColor: 'rgba(99,102,241,0.7)', borderRadius: 1 },
  alignDot: { width: 8, height: 8, borderRadius: 4 },
  scanSteps: {
    position: 'absolute', bottom: '30%', left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  scanStep: { alignItems: 'center', gap: 4 },
  scanStepDot: { borderRadius: 4 },
  scanStepLabel: { fontSize: 8, fontWeight: '600' },
  frameStrip: {
    position: 'absolute', right: 20, zIndex: 20,
    alignItems: 'flex-end', gap: 4,
  },
  frameThumb: { width: 52, height: 36, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  frameStripIndicator: { width: 52, height: 6, borderRadius: 3, backgroundColor: 'rgba(99,102,241,0.5)' },
  bottomControls: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
    paddingHorizontal: 24, gap: 16,
  },
  progressWrap: { gap: 6 },
  progressLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressLabel: { color: 'rgba(255,255,255,0.60)', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  progressPct: { color: '#fff', fontWeight: '700', fontSize: 11 },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' },
  progressFill: {
    height: '100%', borderRadius: 2,
    backgroundColor: '#897FFF',
    shadowColor: '#4A3AFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 4,
  },
  instructionWrap: { alignItems: 'center', gap: 4 },
  instruction: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  subInstruction: { color: 'rgba(255,255,255,0.45)', fontSize: 12, textAlign: 'center' },
  cameraRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  resetBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  captureBtnActive: { borderColor: 'rgba(99,102,241,0.8)' },
  captureBtnInner: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  completeOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  completeContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  completeIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#4A3AFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 20,
  },
  completeTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  completeSub: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  completeSheet: {
    backgroundColor: 'rgba(10,8,30,0.97)',
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    paddingTop: 8, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 0,
  },
  completeSheetHandle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  previewStrip: { marginBottom: 20 },
  previewFrame: { width: 64, height: 44, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', flexShrink: 0 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 32, paddingHorizontal: 24, marginBottom: 20 },
  summaryItem: { gap: 2 },
  summaryValue: { color: '#fff', fontWeight: '700', fontSize: 18 },
  summarySub: { color: 'rgba(255,255,255,0.40)', fontSize: 10 },
  processBtn: { marginHorizontal: 24, borderRadius: 18, overflow: 'hidden', marginBottom: 12, shadowColor: '#4A3AFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  processBtnInner: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  processBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  retakeBtn: { marginHorizontal: 24, paddingVertical: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center' },
  retakeBtnText: { color: 'rgba(255,255,255,0.60)', fontWeight: '600', fontSize: 14 },
});

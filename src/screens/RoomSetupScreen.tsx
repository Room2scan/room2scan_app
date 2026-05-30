/**
 * RoomSetupScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * P4 — 새 방 생성 플로우
 *
 * 방 이름 + 치수(너비/길이/높이) 입력 → Unity에 CreateProceduralRoom 커맨드 전송
 * → Unity가 프로시저럴 방을 빌드하고 ProceduralRoomCreated 이벤트로 응답
 * → onComplete(roomId) 콜백으로 에디터 화면으로 이동
 *
 * 추후 ARCore 측정값이 나오면 치수 입력란을 자동으로 채우는 방식으로 확장.
 */

import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createProceduralRoomPayload,
  ProceduralRoomOptions,
  serializeBridgeMessage,
  deserializeBridgeMessage,
  UNITY_GAME_OBJECT,
  UNITY_RECEIVE_METHOD,
} from '../bridge/unityBridge';
import { saveCustomRoom, saveRoomSpec } from '../utils/roomStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoomSetupScreenProps {
  onBack:     () => void;
  /** Called when Unity confirms the room was created */
  onComplete: (roomId: string, roomName: string) => void;
}

// ─── Unity loader (same pattern as UnityEditorScreen) ─────────────────────────
const tryLoadUnityView = (): any | null => {
  try {
    const m = require('@azesmway/react-native-unity');
    return m.default ?? m;
  } catch { return null; }
};
const UnityView: any = tryLoadUnityView();

// ─── Room type presets ────────────────────────────────────────────────────────

interface RoomPreset {
  id:     string;
  label:  string;
  icon:   string;
  width:  number;
  length: number;
  height: number;
}

const ROOM_PRESETS: RoomPreset[] = [
  { id: 'bedroom',   label: '침실',  icon: '🛏️', width: 3.5, length: 4.0, height: 2.7 },
  { id: 'living',    label: '거실',  icon: '🛋️', width: 5.5, length: 6.0, height: 2.7 },
  { id: 'kitchen',   label: '주방',  icon: '🍳', width: 3.0, length: 4.0, height: 2.5 },
  { id: 'study',     label: '서재',  icon: '📚', width: 3.0, length: 3.5, height: 2.7 },
  { id: 'bathroom',  label: '욕실',  icon: '🚿', width: 2.0, length: 2.5, height: 2.4 },
  { id: 'custom',    label: '직접입력', icon: '✏️', width: 4.0, length: 4.0, height: 2.7 },
];

// ─── Main component ───────────────────────────────────────────────────────────

export const RoomSetupScreen = ({ onBack, onComplete }: RoomSetupScreenProps) => {
  const insets  = useSafeAreaInsets();
  const unityRef = useRef<any>(null);

  const [step,           setStep]           = useState<1 | 2>(1);
  const [selectedPreset, setSelectedPreset] = useState<string>('living');
  const [roomName,       setRoomName]       = useState('');
  const [width,          setWidth]          = useState('5.5');
  const [length,         setLength]         = useState('6.0');
  const [height,         setHeight]         = useState('2.7');
  const [isCreating,     setIsCreating]     = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;

  const applyPreset = (preset: RoomPreset) => {
    setSelectedPreset(preset.id);
    if (preset.id !== 'custom') {
      setWidth(preset.width.toString());
      setLength(preset.length.toString());
      setHeight(preset.height.toString());
    }
  };

  const validateDimensions = () => {
    const w = parseFloat(width);
    const l = parseFloat(length);
    const h = parseFloat(height);
    if (isNaN(w) || w < 1.5 || w > 30) return '너비는 1.5m ~ 30m 사이여야 합니다.';
    if (isNaN(l) || l < 1.5 || l > 30) return '길이는 1.5m ~ 30m 사이여야 합니다.';
    if (isNaN(h) || h < 2.0 || h > 6.0) return '높이는 2.0m ~ 6.0m 사이여야 합니다.';
    return null;
  };

  const handleNext = () => {
    const err = validateDimensions();
    if (err) { setError(err); return; }
    setError(null);
    setStep(2);
  };

  const handleCreate = () => {
    const name = roomName.trim() || ROOM_PRESETS.find(p => p.id === selectedPreset)?.label ?? '새 방';
    const roomId = `custom_${Date.now()}`;

    const opts: ProceduralRoomOptions = {
      roomId,
      name,
      width:         parseFloat(width),
      length:        parseFloat(length),
      height:        parseFloat(height),
      wallThickness: 0.15,
      doors: [
        { wall: 'south', offset: 0.5, width: 0.9, height: 2.1 },
      ],
      windows: [
        { wall: 'north', offset: 0.5, width: 1.2, height: 1.0, sillHeight: 0.9 },
        { wall: 'east',  offset: 0.5, width: 0.8, height: 0.8, sillHeight: 1.0 },
      ],
    };

    const cmd = createProceduralRoomPayload(opts);
    const msg = serializeBridgeMessage(cmd);

    setIsCreating(true);

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    // Persist the room metadata and spec to AsyncStorage regardless of Unity
    saveCustomRoom({
      id:          roomId,
      name,
      createdAt:   new Date().toISOString(),
      lastEdited:  new Date().toISOString(),
      type:        selectedPreset,
      width:       parseFloat(width),
      length:      parseFloat(length),
      height:      parseFloat(height),
    }).catch(e => console.warn('[RoomSetup] saveCustomRoom failed:', e));

    // Save spec separately so UnityEditorScreen can re-send CreateProceduralRoom
    // when the user reopens this room without going through RoomSetupScreen.
    saveRoomSpec(roomId, opts).catch(e => console.warn('[RoomSetup] saveRoomSpec failed:', e));

    if (UnityView && unityRef.current) {
      unityRef.current.postMessage(UNITY_GAME_OBJECT, UNITY_RECEIVE_METHOD, msg);
      // Wait for ProceduralRoomCreated event from Unity
      // (handled by the onUnityMessage callback below)
    } else {
      // Simulation fallback
      setTimeout(() => {
        setIsCreating(false);
        onComplete(roomId, name);
      }, 2200);
    }
  };

  const handleUnityMessage = (event: any) => {
    const raw = event?.nativeEvent?.message ?? '';
    const envelope = deserializeBridgeMessage(raw);
    if (envelope?.kind === 'event' && envelope.name === 'ProceduralRoomCreated') {
      const p = envelope.payload as any;
      if (p?.success) {
        setIsCreating(false);
        onComplete(p.roomId, roomName.trim() || p.roomId);
      } else {
        setIsCreating(false);
        setError('방 생성에 실패했어요. 다시 시도해주세요.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Hidden Unity view for bridge (only used if native build) */}
      {!!UnityView && (
        <UnityView
          ref={unityRef}
          style={styles.hiddenUnity}
          onUnityMessage={handleUnityMessage}
        />
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color="#170F49" />
        </TouchableOpacity>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 ? (
          <>
            {/* Step 1: Room type + dimensions */}
            <Text style={styles.stepLabel}>1 / 2</Text>
            <Text style={styles.title}>어떤 방을 만들까요?</Text>
            <Text style={styles.subtitle}>방 유형을 선택하거나 직접 치수를 입력하세요</Text>

            {/* Preset grid */}
            <View style={styles.presetGrid}>
              {ROOM_PRESETS.map(preset => (
                <TouchableOpacity
                  key={preset.id}
                  onPress={() => applyPreset(preset)}
                  activeOpacity={0.85}
                  style={[
                    styles.presetCard,
                    selectedPreset === preset.id && styles.presetCardActive,
                  ]}
                >
                  <Text style={styles.presetIcon}>{preset.icon}</Text>
                  <Text style={[
                    styles.presetLabel,
                    selectedPreset === preset.id && styles.presetLabelActive,
                  ]}>{preset.label}</Text>
                  {preset.id !== 'custom' && (
                    <Text style={styles.presetDim}>{preset.width}×{preset.length}m</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Dimension inputs */}
            <View style={styles.dimSection}>
              <Text style={styles.sectionTitle}>치수 (m)</Text>
              <View style={styles.dimRow}>
                <DimInput label="너비" value={width}  onChangeText={v => { setWidth(v);  setSelectedPreset('custom'); }} />
                <DimInput label="길이" value={length} onChangeText={v => { setLength(v); setSelectedPreset('custom'); }} />
                <DimInput label="높이" value={height} onChangeText={v => { setHeight(v); setSelectedPreset('custom'); }} />
              </View>
            </View>

            {/* Dimension visualizer */}
            <RoomVisualizer
              width={parseFloat(width)  || 4}
              length={parseFloat(length) || 4}
              height={parseFloat(height) || 2.7}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}
          </>
        ) : (
          <>
            {/* Step 2: Room name */}
            <Text style={styles.stepLabel}>2 / 2</Text>
            <Text style={styles.title}>방 이름을 지어주세요</Text>
            <Text style={styles.subtitle}>나중에 바꿀 수 있어요</Text>

            <TextInput
              style={styles.nameInput}
              value={roomName}
              onChangeText={setRoomName}
              placeholder={ROOM_PRESETS.find(p => p.id === selectedPreset)?.label ?? '새 방'}
              placeholderTextColor="#A0A3BD"
              maxLength={30}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />

            {/* Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Feather name="maximize-2" size={16} color="#4A3AFF" />
                <Text style={styles.summaryText}>
                  {width} × {length} × {height} m
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Feather name="square" size={16} color="#4A3AFF" />
                <Text style={styles.summaryText}>
                  면적 {(parseFloat(width) * parseFloat(length)).toFixed(1)} m²
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Feather name="grid" size={16} color="#4A3AFF" />
                <Text style={styles.summaryText}>
                  {ROOM_PRESETS.find(p => p.id === selectedPreset)?.label ?? '맞춤 방'}
                </Text>
              </View>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {isCreating && (
              <View style={styles.progressWrap}>
                <Text style={styles.progressLabel}>방을 만들고 있어요...</Text>
                <View style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      { width: progressAnim.interpolate({ inputRange: [0,1], outputRange: ['0%','100%'] }) },
                    ]}
                  />
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* CTA Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {step === 1 ? (
          <TouchableOpacity onPress={handleNext} activeOpacity={0.9} style={styles.ctaBtn}>
            <LinearGradient
              colors={['#4A3AFF', '#897FFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>다음</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleCreate}
            activeOpacity={0.9}
            style={[styles.ctaBtn, isCreating && styles.ctaBtnDisabled]}
            disabled={isCreating}
          >
            <LinearGradient
              colors={isCreating ? ['#9CA3AF','#9CA3AF'] : ['#4A3AFF', '#897FFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              {isCreating ? (
                <Text style={styles.ctaText}>생성 중...</Text>
              ) : (
                <>
                  <Feather name="check" size={18} color="#fff" />
                  <Text style={styles.ctaText}>방 만들기</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── DimInput sub-component ───────────────────────────────────────────────────

const DimInput = ({
  label,
  value,
  onChangeText,
}: { label: string; value: string; onChangeText: (v: string) => void }) => (
  <View style={styles.dimInput}>
    <Text style={styles.dimLabel}>{label}</Text>
    <TextInput
      style={styles.dimField}
      value={value}
      onChangeText={onChangeText}
      keyboardType="decimal-pad"
      selectTextOnFocus
      maxLength={5}
    />
    <Text style={styles.dimUnit}>m</Text>
  </View>
);

// ─── RoomVisualizer sub-component ─────────────────────────────────────────────

const RoomVisualizer = ({ width, length, height }: { width: number; length: number; height: number }) => {
  const { width: SW } = Dimensions.get('window');
  const vw = SW - 64;
  const maxDim = Math.max(width, length, 1);
  const scale = (vw * 0.7) / maxDim;
  const rw = width  * scale;
  const rl = length * scale;

  return (
    <View style={styles.visualizerWrap}>
      <View style={[styles.visualizerRoom, { width: rw, height: rl }]}>
        {/* door cutout south */}
        <View style={styles.doorCutout} />
        <Text style={styles.visualizerDim}>{width}m</Text>
        <Text style={styles.visualizerDimV}>{length}m</Text>
        <Text style={styles.visualizerH}>↕ {height}m</Text>
      </View>
      <Text style={styles.visualizerCaption}>
        면적 {(width * length).toFixed(1)} m²  ·  체적 {(width * length * height).toFixed(1)} m³
      </Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#FBFBFE' },
  hiddenUnity:   { width: 1, height: 1, opacity: 0, position: 'absolute' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  backBtn:       { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  stepDotActive: { backgroundColor: '#4A3AFF', width: 10, height: 10, borderRadius: 5 },
  stepLine:      { width: 32, height: 2, backgroundColor: '#E5E7EB', borderRadius: 1 },
  stepLineActive:{ backgroundColor: '#4A3AFF' },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8 },
  stepLabel:     { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 4, color: '#4A3AFF', marginBottom: 8 },
  title:         { fontSize: 26, fontWeight: '800', color: '#170F49', letterSpacing: -0.5, marginBottom: 8 },
  subtitle:      { fontSize: 14, color: '#6B7280', marginBottom: 24 },

  presetGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  presetCard: {
    width: '30.5%', paddingVertical: 14, paddingHorizontal: 8, borderRadius: 16,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB',
    alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  presetCardActive:  { borderColor: '#4A3AFF', backgroundColor: '#EEF0FF' },
  presetIcon:        { fontSize: 24 },
  presetLabel:       { fontSize: 13, fontWeight: '600', color: '#374151' },
  presetLabelActive: { color: '#4A3AFF', fontWeight: '700' },
  presetDim:         { fontSize: 10, color: '#9CA3AF' },

  dimSection:  { marginBottom: 24 },
  sectionTitle:{ fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 },
  dimRow:      { flexDirection: 'row', gap: 12 },
  dimInput:    { flex: 1, alignItems: 'center', gap: 4 },
  dimLabel:    { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  dimField: {
    width: '100%', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 12, fontSize: 18, fontWeight: '700', color: '#170F49',
    textAlign: 'center', backgroundColor: '#fff',
  },
  dimUnit:     { fontSize: 11, color: '#9CA3AF' },

  visualizerWrap: { alignItems: 'center', paddingVertical: 20, marginBottom: 8 },
  visualizerRoom: {
    borderWidth: 3, borderColor: '#4A3AFF', backgroundColor: '#F5F3FF',
    borderRadius: 4, justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  doorCutout: {
    position: 'absolute', bottom: -3, left: '45%',
    width: 24, height: 6, backgroundColor: '#FBFBFE',
  },
  visualizerDim:    { fontSize: 11, fontWeight: '600', color: '#4A3AFF', position: 'absolute', top: 6 },
  visualizerDimV:   { fontSize: 11, fontWeight: '600', color: '#4A3AFF', position: 'absolute', right: -28 },
  visualizerH:      { fontSize: 10, color: '#6B7280', position: 'absolute', bottom: 6 },
  visualizerCaption:{ fontSize: 12, color: '#9CA3AF', marginTop: 24, textAlign: 'center' },

  nameInput: {
    borderWidth: 2, borderColor: '#4A3AFF', borderRadius: 16,
    paddingHorizontal: 20, paddingVertical: 16,
    fontSize: 20, fontWeight: '700', color: '#170F49',
    backgroundColor: '#fff', marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 14,
    borderWidth: 1, borderColor: '#EAE8FF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryText:{ fontSize: 15, fontWeight: '600', color: '#374151' },

  progressWrap:  { marginTop: 24, gap: 10 },
  progressLabel: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  progressBar:   { height: 6, backgroundColor: '#EAE8FF', borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: '#4A3AFF', borderRadius: 3 },

  errorText: { color: '#EF4444', fontSize: 13, marginTop: 8, textAlign: 'center' },

  footer:      { paddingHorizontal: 24, paddingTop: 12, backgroundColor: '#FBFBFE', borderTopWidth: 1, borderTopColor: '#F1F2F9' },
  ctaBtn:      { borderRadius: 18, overflow: 'hidden', shadowColor: '#897FFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  ctaBtnDisabled: { shadowOpacity: 0 },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18 },
  ctaText:     { fontSize: 17, fontWeight: '700', color: '#fff' },
});

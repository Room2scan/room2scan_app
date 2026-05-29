import React, { useEffect, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  UNITY_GAME_OBJECT,
  UNITY_RECEIVE_METHOD,
  UnityBridgeEnvelope,
  createAddFurniturePayload,
  createDeleteSelectedPayload,
  createMockRoomPayload,
  createMockUnityEvent,
  createResetEditorPayload,
  createRotateSelectedPayload,
  createSaveLayoutPayload,
  createSelectFurniturePayload,
  serializeBridgeMessage,
} from '../bridge/unityBridge';

type UnityViewHandle = {
  postMessage: (gameObject: string, methodName: string, message: string) => void;
};

type UnityMessageEvent = NativeSyntheticEvent<{
  message: string;
}>;

type LogItem = {
  id: string;
  direction: 'RN -> Unity' | 'Unity -> RN';
  label: string;
  body: string;
};

const tryLoadUnityView = (): any | null => {
  try {
    const packageName = '@azesmway/react-native-unity';
    const unityModule = require(packageName);
    return unityModule.default ?? unityModule;
  } catch {
    return null;
  }
};

const UnityView: any = tryLoadUnityView();

let furnitureCounter = 0;
const nextInstanceId = () => `furn_${++furnitureCounter}_${Date.now()}`;

export const UnityEditorScreen = ({ onBack }: { onBack: () => void }) => {
  const insets = useSafeAreaInsets();
  const unityRef = useRef<UnityViewHandle | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [addedInstanceIds, setAddedInstanceIds] = useState<string[]>([]);

  const addLog = (direction: LogItem['direction'], label: string, body: string) => {
    setLogs(prev => [
      { id: `${Date.now()}_${Math.random()}`, direction, label, body },
      ...prev,
    ].slice(0, 12));
  };

  const receiveFromUnity = (rawMessage: string) => {
    addLog('Unity -> RN', 'Bridge event', rawMessage);
  };

  const simulateUnityResponse = (command: UnityBridgeEnvelope) => {
    switch (command.name) {
      case 'LoadRoom':
        receiveFromUnity(serializeBridgeMessage(createMockUnityEvent(command.requestId, 'RoomLoaded', {
          roomId: 'replica_room0',
          success: true,
        })));
        break;
      case 'SaveLayout':
        receiveFromUnity(serializeBridgeMessage(createMockUnityEvent(command.requestId, 'LayoutSaved', {
          layout: {
            schemaVersion: 'layout-json/v1',
            layoutId: 'mock_layout_0001',
            roomId: 'replica_room0',
            items: addedInstanceIds.map(id => ({ instanceId: id, catalogId: 'mock_chair', position: { x: 0, y: 0, z: 0 }, rotationYDeg: 0, scale: 0.8 })),
          },
        })));
        break;
    }
  };

  const sendToUnity = (command: UnityBridgeEnvelope) => {
    const message = serializeBridgeMessage(command);
    addLog('RN -> Unity', command.name, message);

    if (UnityView && unityRef.current) {
      unityRef.current.postMessage(UNITY_GAME_OBJECT, UNITY_RECEIVE_METHOD, message);
      return;
    }

    simulateUnityResponse(command);
  };

  const handleAddFurniture = () => {
    const instanceId = nextInstanceId();
    const x = (Math.random() - 0.5) * 4;
    const z = (Math.random() - 0.5) * 4;
    sendToUnity(createAddFurniturePayload(instanceId, 'mock_chair', { x, y: 0, z }));
    setAddedInstanceIds(prev => [...prev, instanceId]);
    setSelectedInstanceId(instanceId);
  };

  const handleSelectLast = () => {
    if (addedInstanceIds.length === 0) return;
    const instanceId = addedInstanceIds[addedInstanceIds.length - 1];
    sendToUnity(createSelectFurniturePayload(instanceId));
    setSelectedInstanceId(instanceId);
  };

  const handleRotate = () => {
    sendToUnity(createRotateSelectedPayload(45));
  };

  const handleDelete = () => {
    sendToUnity(createDeleteSelectedPayload());
    if (selectedInstanceId) {
      setAddedInstanceIds(prev => prev.filter(id => id !== selectedInstanceId));
      setSelectedInstanceId(null);
    }
  };

  const handleReset = () => {
    sendToUnity(createResetEditorPayload());
    setAddedInstanceIds([]);
    setSelectedInstanceId(null);
    furnitureCounter = 0;
  };

  useEffect(() => {
    sendToUnity(createMockRoomPayload());
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F7F8FC', '#E9ECF6']} style={StyleSheet.absoluteFillObject} />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={onBack} style={styles.iconButton} activeOpacity={0.8}>
          <Feather name="chevron-left" size={20} color="#170F49" />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.kicker}>P1 Furniture</Text>
          <Text style={styles.title}>Room Editor</Text>
        </View>
        <TouchableOpacity onPress={() => sendToUnity(createSaveLayoutPayload())} style={styles.saveButton} activeOpacity={0.86}>
          <Feather name="save" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.unityFrame}>
        {UnityView ? (
          <UnityView
            ref={unityRef}
            style={styles.unityView}
            fullScreen
            onUnityMessage={(event: UnityMessageEvent) => receiveFromUnity(event.nativeEvent.message)}
          />
        ) : (
          <View style={styles.fallbackScene}>
            <Feather name="box" size={42} color="#4A3AFF" />
            <Text style={styles.fallbackTitle}>Unity native view pending</Text>
            <Text style={styles.fallbackCopy}>
              The RN bridge contract is active. Install the Unity native package and export the Unity build to render the real editor here.
            </Text>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Fallback bridge simulator</Text>
            </View>
          </View>
        )}
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.furnitureToolbar}>
          <TouchableOpacity onPress={handleAddFurniture} style={styles.toolBtn} activeOpacity={0.82}>
            <Feather name="plus-square" size={18} color="#4A3AFF" />
            <Text style={styles.toolBtnText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSelectLast}
            style={[styles.toolBtn, addedInstanceIds.length === 0 && styles.toolBtnDisabled]}
            activeOpacity={0.82}
            disabled={addedInstanceIds.length === 0}
          >
            <Feather name="mouse-pointer" size={18} color={addedInstanceIds.length === 0 ? '#C0C2D0' : '#4A3AFF'} />
            <Text style={[styles.toolBtnText, addedInstanceIds.length === 0 && styles.toolBtnTextDisabled]}>Select</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRotate}
            style={[styles.toolBtn, !selectedInstanceId && styles.toolBtnDisabled]}
            activeOpacity={0.82}
            disabled={!selectedInstanceId}
          >
            <Feather name="rotate-cw" size={18} color={selectedInstanceId ? '#4A3AFF' : '#C0C2D0'} />
            <Text style={[styles.toolBtnText, !selectedInstanceId && styles.toolBtnTextDisabled]}>Rotate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={[styles.toolBtn, !selectedInstanceId && styles.toolBtnDisabled]}
            activeOpacity={0.82}
            disabled={!selectedInstanceId}
          >
            <Feather name="trash-2" size={18} color={selectedInstanceId ? '#EF4444' : '#C0C2D0'} />
            <Text style={[styles.toolBtnText, !selectedInstanceId && styles.toolBtnTextDisabled, selectedInstanceId && styles.toolBtnTextDanger]}>Delete</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={() => sendToUnity(createMockRoomPayload())} style={styles.secondaryButton} activeOpacity={0.86}>
            <Feather name="upload" size={16} color="#4A3AFF" />
            <Text style={styles.secondaryButtonText}>LoadRoom</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => sendToUnity(createSaveLayoutPayload())} style={styles.primaryButton} activeOpacity={0.86}>
            <Feather name="download" size={16} color="#fff" />
            <Text style={styles.primaryButtonText}>SaveLayout</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReset} style={styles.dangerButton} activeOpacity={0.86}>
            <Feather name="refresh-cw" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.logPanel}>
          <View style={styles.logHeader}>
            <Text style={styles.logTitle}>Bridge log</Text>
            <Text style={styles.logMeta}>{UnityView ? 'native' : 'fallback'} · {addedInstanceIds.length} items</Text>
          </View>
          <ScrollView style={styles.logScroll} showsVerticalScrollIndicator={false}>
            {logs.map(log => (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logItemHeader}>
                  <Text style={styles.logDirection}>{log.direction}</Text>
                  <Text style={styles.logLabel}>{log.label}</Text>
                </View>
                <Text style={styles.logBody} numberOfLines={2}>{log.body}</Text>
              </View>
            ))}
            {logs.length === 0 && <Text style={styles.emptyLog}>Waiting for bridge messages.</Text>}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.64)',
  },
  titleBlock: { alignItems: 'center' },
  kicker: { fontSize: 10, fontWeight: '800', color: '#7A7D92', textTransform: 'uppercase' },
  title: { fontSize: 16, fontWeight: '800', color: '#170F49' },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A3AFF',
  },
  unityFrame: {
    flex: 1,
    marginTop: 96,
    marginHorizontal: 16,
    marginBottom: 316,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#10121D',
    borderWidth: 1,
    borderColor: 'rgba(23,15,73,0.10)',
  },
  unityView: { flex: 1 },
  fallbackScene: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  fallbackTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  fallbackCopy: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.72)',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#34D399' },
  statusText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: '#FBFBFE',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  furnitureToolbar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: '#F1F2F9',
    borderRadius: 10,
  },
  toolBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  toolBtnDisabled: { backgroundColor: 'transparent' },
  toolBtnText: { fontSize: 10, fontWeight: '800', color: '#4A3AFF' },
  toolBtnTextDisabled: { color: '#C0C2D0' },
  toolBtnTextDanger: { color: '#EF4444' },
  buttonRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#ECEBFF',
  },
  secondaryButtonText: { fontSize: 13, fontWeight: '800', color: '#4A3AFF' },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#4A3AFF',
  },
  primaryButtonText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  dangerButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
  },
  logPanel: { height: 160, borderRadius: 8, padding: 10, backgroundColor: '#F1F2F9' },
  logHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  logTitle: { fontSize: 13, fontWeight: '800', color: '#170F49' },
  logMeta: { fontSize: 10, fontWeight: '800', color: '#7A7D92', textTransform: 'uppercase' },
  logScroll: { flex: 1 },
  logItem: { padding: 8, borderRadius: 6, backgroundColor: '#fff', marginBottom: 6 },
  logItemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  logDirection: { fontSize: 10, fontWeight: '900', color: '#4A3AFF' },
  logLabel: { fontSize: 10, fontWeight: '800', color: '#7A7D92' },
  logBody: { fontSize: 10, lineHeight: 14, color: '#514F6E' },
  emptyLog: { fontSize: 12, color: '#7A7D92' },
});

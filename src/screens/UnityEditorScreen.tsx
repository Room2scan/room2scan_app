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
  createMockRoomPayload,
  createMockUnityEvent,
  createSaveLayoutPayload,
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

export const UnityEditorScreen = ({ onBack }: { onBack: () => void }) => {
  const insets = useSafeAreaInsets();
  const unityRef = useRef<UnityViewHandle | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [lastLoadRequestId, setLastLoadRequestId] = useState<string | undefined>();

  const addLog = (direction: LogItem['direction'], label: string, body: string) => {
    setLogs(prev => [
      { id: `${Date.now()}_${Math.random()}`, direction, label, body },
      ...prev,
    ].slice(0, 8));
  };

  const receiveFromUnity = (rawMessage: string) => {
    addLog('Unity -> RN', 'Bridge event', rawMessage);
  };

  const simulateUnityResponse = (command: UnityBridgeEnvelope) => {
    if (command.name === 'LoadRoom') {
      receiveFromUnity(serializeBridgeMessage(createMockUnityEvent(command.requestId, 'RoomLoaded', {
        roomId: 'replica_room0',
        success: true,
      })));
      return;
    }

    if (command.name === 'SaveLayout') {
      receiveFromUnity(serializeBridgeMessage(createMockUnityEvent(command.requestId, 'LayoutSaved', {
        layout: {
          schemaVersion: 'layout-json/v1',
          layoutId: 'mock_layout_0001',
          roomId: 'replica_room0',
          roomSchemaVersion: 'room-json/v1',
          editorSessionId: 'rn_p0_fallback',
          savedAt: new Date().toISOString(),
          coordinateSystem: {
            unit: 'meter',
            handedness: 'left',
            upAxis: '+Y',
            forwardAxis: '+Z',
          },
          items: [],
          validation: {
            isValid: true,
            invalidItemIds: [],
            warnings: [],
          },
          extensions: {
            source: 'rn_fallback_mock',
          },
        },
      })));
    }
  };

  const sendToUnity = (command: UnityBridgeEnvelope) => {
    const message = serializeBridgeMessage(command);
    addLog('RN -> Unity', command.name, message);

    if (command.name === 'LoadRoom') {
      setLastLoadRequestId(command.requestId);
    }

    if (UnityView && unityRef.current) {
      unityRef.current.postMessage(UNITY_GAME_OBJECT, UNITY_RECEIVE_METHOD, message);
      return;
    }

    simulateUnityResponse(command);
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
          <Text style={styles.kicker}>P0 Unity Bridge</Text>
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
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={() => sendToUnity(createMockRoomPayload())} style={styles.secondaryButton} activeOpacity={0.86}>
            <Feather name="upload" size={16} color="#4A3AFF" />
            <Text style={styles.secondaryButtonText}>LoadRoom</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => sendToUnity(createSaveLayoutPayload())} style={styles.primaryButton} activeOpacity={0.86}>
            <Feather name="download" size={16} color="#fff" />
            <Text style={styles.primaryButtonText}>SaveLayout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logPanel}>
          <View style={styles.logHeader}>
            <Text style={styles.logTitle}>Bridge log</Text>
            <Text style={styles.logMeta}>{UnityView ? 'native' : 'fallback'}</Text>
          </View>
          <ScrollView style={styles.logScroll} showsVerticalScrollIndicator={false}>
            {logs.map(log => (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logItemHeader}>
                  <Text style={styles.logDirection}>{log.direction}</Text>
                  <Text style={styles.logLabel}>{log.label}</Text>
                </View>
                <Text style={styles.logBody} numberOfLines={3}>{log.body}</Text>
              </View>
            ))}
            {logs.length === 0 && <Text style={styles.emptyLog}>Waiting for bridge messages.</Text>}
          </ScrollView>
          {lastLoadRequestId && <Text style={styles.requestHint}>Last LoadRoom request: {lastLoadRequestId}</Text>}
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
    marginBottom: 286,
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
  buttonRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#ECEBFF',
  },
  secondaryButtonText: { fontSize: 13, fontWeight: '800', color: '#4A3AFF' },
  primaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#4A3AFF',
  },
  primaryButtonText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  logPanel: { height: 198, borderRadius: 8, padding: 12, backgroundColor: '#F1F2F9' },
  logHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  logTitle: { fontSize: 13, fontWeight: '800', color: '#170F49' },
  logMeta: { fontSize: 10, fontWeight: '800', color: '#7A7D92', textTransform: 'uppercase' },
  logScroll: { flex: 1 },
  logItem: { padding: 10, borderRadius: 8, backgroundColor: '#fff', marginBottom: 8 },
  logItemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  logDirection: { fontSize: 10, fontWeight: '900', color: '#4A3AFF' },
  logLabel: { fontSize: 10, fontWeight: '800', color: '#7A7D92' },
  logBody: { fontSize: 10, lineHeight: 14, color: '#514F6E' },
  emptyLog: { fontSize: 12, color: '#7A7D92' },
  requestHint: { marginTop: 6, fontSize: 10, color: '#7A7D92' },
});

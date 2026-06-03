// ─────────────────────────────────────────────────────────────────────────────
// UnityEditorScreen.tsx
// Mobile Room Editor — React Native port of the Figma Make design
// All bridge calls wired up; Unity events parsed and reflected in UI state.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  NativeSyntheticEvent,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Defs, Path, Pattern, Polygon, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  UNITY_GAME_OBJECT,
  UNITY_RECEIVE_METHOD,
  UnityBridgeEnvelope,
  ProceduralRoomOptions,
  createAddFurniturePayload,
  createDeleteSelectedPayload,
  createDuplicateSelectedPayload,
  createMockRoomPayload,
  createProceduralRoomPayload,
  createRoomPayload,
  createMockUnityEvent,
  createRedoPayload,
  createResetEditorPayload,
  createRotateSelectedPayload,
  createSaveLayoutPayload,
  createSelectFurniturePayload,
  createSetActiveToolPayload,
  createSetLockedPayload,
  createSetSnapPayload,
  createSetViewModePayload,
  createSetVisibilityPayload,
  createUndoPayload,
  deserializeBridgeMessage,
  serializeBridgeMessage,
  EditorToolId,
} from '../bridge/unityBridge';
import { ALL_FURNITURE, MY_ROOMS } from '../data';
import { FurnitureItem, RoomProject } from '../types';
import { saveLayout, loadLayout } from '../utils/layoutStorage';
import { loadRoomSpec, loadCustomRoom, refreshFurnitureCount } from '../utils/roomStorage';
import { syncLayout as apiSyncLayout, PlacementItem } from '../utils/apiClient';

// ─── Design tokens ────────────────────────────────────────────────────────────
const PRIMARY       = '#4A3AFF';
const PRIMARY_LIGHT = '#ECEBFF';
const RED           = '#EF4444';
const N100 = '#F3F4F6';
const N200 = '#E5E7EB';
const N300 = '#D1D5DB';
const N400 = '#9CA3AF';
const N500 = '#6B7280';
const N600 = '#4B5563';
const N700 = '#374151';
const N900 = '#111827';

// ─── Types ────────────────────────────────────────────────────────────────────
type UnityViewHandle = {
  postMessage: (go: string, method: string, msg: string) => void;
};
type UnityMessageEvent = NativeSyntheticEvent<{ message: string }>;

const LOAD_ROOM_RETRY_DELAY_MS = 1500;
const LOAD_ROOM_MAX_RETRIES = 120;
const LOCAL_ROOM1_BOUNDS = {
  min: { x: -0.10, y: 0.0, z: -1.23 },
  max: { x:  2.26, y: 1.02, z:  0.04 },
};

type LogItem = {
  id: string;
  direction: 'RN → Unity' | 'Unity → RN';
  label: string;
  body: string;
};
type ActiveTab = 'object' | 'add' | 'structure';

type TransformState = {
  position:     { x: number; y: number; z: number };
  rotationYDeg: number;
  scale:        number;
};

// ─── Unity loader ─────────────────────────────────────────────────────────────
const tryLoadUnityView = (): any | null => {
  try {
    const m = require('@azesmway/react-native-unity');
    return m.default ?? m;
  } catch {
    return null;
  }
};
const UnityView: any = tryLoadUnityView();

// ─── Furniture counter (RN-side IDs for locally-initiated adds) ───────────────
let furnitureCounter = 0;
const nextInstanceId = () => `furn_${++furnitureCounter}_${Date.now()}`;

// ─── Editor category tabs (subset of main catalog) ───────────────────────────
const EDITOR_CATS: { label: string; type: string | null }[] = [
  { label: '전체',    type: null           },
  { label: '소파',    type: 'Sofa'         },
  { label: '의자',    type: 'Chair'        },
  { label: '테이블',  type: 'Table'        },
  { label: '수납',    type: 'Shelf'        },
  { label: '주방',    type: 'Kitchen'      },
  { label: '장식',    type: 'Decor'        },
  { label: '전자기기', type: 'Electronics'  },
  { label: '내 가구', type: 'myFurniture'  },
];

const TOOLS: { id: EditorToolId; label: string; icon: string }[] = [
  { id: 'select',    label: '선택', icon: 'mouse-pointer' },
  { id: 'move',      label: '이동', icon: 'move'          },
  { id: 'rotate',    label: '회전', icon: 'rotate-cw'     },
  { id: 'scale',     label: '크기', icon: 'maximize-2'    },
  { id: 'duplicate', label: '복제', icon: 'copy'          },
  { id: 'delete',    label: '삭제', icon: 'trash-2'       },
];

const STRUCTURE_ITEMS: { label: string; count: number; icon: string }[] = [
  { label: '벽',  count: 4, icon: 'square'   },
  { label: '바닥', count: 1, icon: 'minus'    },
  { label: '천장', count: 1, icon: 'layers'   },
  { label: '문',  count: 1, icon: 'log-out'   },
  { label: '창문', count: 2, icon: 'monitor'  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export const UnityEditorScreen = ({
  onBack,
  roomId,
}: {
  onBack: () => void;
  roomId?: string;
}) => {
  const insets = useSafeAreaInsets();
  const { width: SW, height: SH } = Dimensions.get('window');
  const HEADER_H  = insets.top + 44;
  const CATALOG_W = Math.floor((SW - 32 - 16) / 3);

  // ── Bottom-sheet snap positions (as `top` from screen top) ───────────────
  const SNAP = [SH * 0.28, SH * 0.57, SH * 0.86];

  // ── Bridge state ──────────────────────────────────────────────────────────
  const unityRef = useRef<UnityViewHandle | null>(null);
  const [, setLogs] = useState<LogItem[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [addedInstanceIds, setAddedInstanceIds]     = useState<string[]>([]);

  // ── Unity connection tracking ─────────────────────────────────────────────
  // true once Unity sends back a successful RoomLoaded event.
  // When false (native Unity present but no response in 4 s) we fall back to
  // the 2-D simulation floor-plan overlay.
  const [unityConnected, setUnityConnected] = useState(false);
  const unityFallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingLoadRoomCmd  = useRef<UnityBridgeEnvelope | null>(null);
  const loadRoomRetryCount  = useRef(0);
  const unityBridgeReady    = useRef(false);
  const loadRoomPostedToReadyBridge = useRef(false);
  const layoutRestoredRef   = useRef(false); // prevent double-restore per session

  // ── Custom (procedural) room spec — loaded from AsyncStorage for re-entry ──
  const [customRoomSpec, setCustomRoomSpec] = useState<ProceduralRoomOptions | null>(null);

  // ── Editor-mode state (mirrored in Unity) ─────────────────────────────────
  const [viewMode,    setViewMode]    = useState<'2D' | '3D'>('3D');
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [selectedTool, setSelectedTool] = useState<EditorToolId>('select');
  const [roomDisplayName, setRoomDisplayName] = useState(roomId ?? 'room');
  const [editingRoomName, setEditingRoomName] = useState(false);

  // ── Per-object state (updated from Unity events) ──────────────────────────
  const [objectTransforms, setObjectTransforms] =
    useState<Record<string, TransformState>>({});
  const [objectVisibility, setObjectVisibility] =
    useState<Record<string, boolean>>({});   // true = visible (default)
  const [objectLocked, setObjectLocked] =
    useState<Record<string, boolean>>({});   // true = locked  (default false)
  const [objectCatalogIds, setObjectCatalogIds] =
    useState<Record<string, string>>({});    // instanceId → catalogId
  const [collisionState, setCollisionState] =
    useState<Record<string, boolean>>({});

  // ── UI-navigation state ───────────────────────────────────────────────────
  const [activeTab,           setActiveTab]           = useState<ActiveTab>('object');
  const [showObjectDetail,    setShowObjectDetail]    = useState(false);
  const [showAddDetail,       setShowAddDetail]       = useState(false);
  const [showStructureDetail, setShowStructureDetail] = useState(false);
  const [selectedCatalogId,   setSelectedCatalogId]   = useState(ALL_FURNITURE[0].id);
  const [catFilter,           setCatFilter]           = useState(0);
  const [activeMat,           setActiveMat]           = useState<Record<string, number>>({});

  // ── Bottom-sheet animation ────────────────────────────────────────────────
  const lastTopRef   = useRef(SNAP[1]);
  const sheetTopAnim = useRef(new Animated.Value(SNAP[1])).current;

  const snapTo = (idx: number) => {
    lastTopRef.current = SNAP[idx];
    Animated.spring(sheetTopAnim, {
      toValue: SNAP[idx],
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  (_, gs) => Math.abs(gs.dy) > 4,
      onPanResponderMove: (_, gs) => {
        const next    = lastTopRef.current + gs.dy;
        const clamped = Math.max(SNAP[0] - 40, Math.min(SNAP[2] + 40, next));
        sheetTopAnim.setValue(clamped);
      },
      onPanResponderRelease: (_, gs) => {
        const current = lastTopRef.current + gs.dy;
        const nearest = SNAP.reduce((p, c) =>
          Math.abs(c - current) < Math.abs(p - current) ? c : p, SNAP[0]);
        lastTopRef.current = nearest;
        Animated.spring(sheetTopAnim, {
          toValue: nearest,
          useNativeDriver: false,
          damping: 20,
          stiffness: 200,
        }).start();
      },
    })
  ).current;

  // ─────────────────────────────────────────────────────────────────────────
  // Bridge helpers
  // ─────────────────────────────────────────────────────────────────────────

  const addLog = (direction: LogItem['direction'], label: string, body: string) => {
    setLogs(prev =>
      [{ id: `${Date.now()}_${Math.random()}`, direction, label, body }, ...prev].slice(0, 30)
    );
  };

  /** Parse an incoming Unity event and update the relevant UI state. */
  const handleUnityEvent = (name: string, payload: Record<string, any>) => {
    switch (name) {
      case 'BridgeReady': {
        unityBridgeReady.current = true;
        const pending = pendingLoadRoomCmd.current;
        if (pending && !loadRoomPostedToReadyBridge.current) {
          loadRoomRetryCount.current = 0;
          loadRoomPostedToReadyBridge.current = postToNativeUnity(pending);
          clearLoadRoomTimer();
        }
        break;
      }

      case 'RoomLoaded': {
        // Unity confirmed the room loaded — cancel fallback timer, reveal 3-D view.
        if (payload.success) {
          if (!payload.simulated) {
            setUnityConnected(true);
            pendingLoadRoomCmd.current = null;
            loadRoomRetryCount.current = 0;
            loadRoomPostedToReadyBridge.current = false;
          }
          if (unityFallbackTimer.current) {
            clearTimeout(unityFallbackTimer.current);
            unityFallbackTimer.current = null;
          }
        }
        break;
      }

      case 'FurnitureAdded': {
        const { instanceId, success, position, rotationYDeg = 0, scale = 0.8, catalogId, isDuplicate } = payload;
        if (!success || !instanceId) break;

        // Add to list if not already tracked (covers duplicates from Unity)
        setAddedInstanceIds(prev =>
          prev.includes(instanceId) ? prev : [...prev, instanceId]
        );
        if (position) {
          setObjectTransforms(prev => ({
            ...prev,
            [instanceId]: { position, rotationYDeg, scale },
          }));
        }
        if (catalogId) {
          setObjectCatalogIds(prev => ({ ...prev, [instanceId]: catalogId }));
        }
        // If it was a duplicate, auto-select the new item
        if (isDuplicate && instanceId) {
          setSelectedInstanceId(instanceId);
          setShowObjectDetail(true);
        }
        break;
      }

      case 'FurnitureSelected': {
        const { instanceId, success, position, rotationYDeg = 0, scale = 0.8 } = payload;
        if (success && position && instanceId) {
          setSelectedInstanceId(instanceId);
          setShowObjectDetail(true);
          setObjectTransforms(prev => ({
            ...prev,
            [instanceId]: { position, rotationYDeg, scale },
          }));
        }
        break;
      }

      case 'FurnitureTransformed': {
        const { instanceId, success, position, rotationYDeg } = payload;
        if (success && instanceId && position) {
          setObjectTransforms(prev => ({
            ...prev,
            [instanceId]: {
              position,
              rotationYDeg: rotationYDeg ?? prev[instanceId]?.rotationYDeg ?? 0,
              scale: prev[instanceId]?.scale ?? 0.8,
            },
          }));
        }
        break;
      }

      case 'FurnitureDeleted': {
        const { instanceId, success } = payload;
        if (success && instanceId) {
          setAddedInstanceIds(prev => prev.filter(id => id !== instanceId));
          setSelectedInstanceId(id => (id === instanceId ? null : id));
          setShowObjectDetail(prev => (selectedInstanceId === instanceId ? false : prev));
        }
        break;
      }

      case 'ObjectListUpdated': {
        // Unity sends the authoritative list — sync all per-object state
        const items: any[] = payload.items ?? [];
        setAddedInstanceIds(items.map((i: any) => i.instanceId));
        setObjectTransforms(() => {
          const next: Record<string, TransformState> = {};
          items.forEach((i: any) => {
            next[i.instanceId] = {
              position:     i.position     ?? { x: 0, y: 0, z: 0 },
              rotationYDeg: i.rotationYDeg ?? 0,
              scale:        i.scale        ?? 0.8,
            };
          });
          return next;
        });
        setObjectVisibility(() => {
          const next: Record<string, boolean> = {};
          items.forEach((i: any) => { next[i.instanceId] = i.visible ?? true; });
          return next;
        });
        setObjectLocked(() => {
          const next: Record<string, boolean> = {};
          items.forEach((i: any) => { next[i.instanceId] = i.locked ?? false; });
          return next;
        });
        setObjectCatalogIds(() => {
          const next: Record<string, string> = {};
          items.forEach((i: any) => { if (i.catalogId) next[i.instanceId] = i.catalogId; });
          return next;
        });
        break;
      }

      case 'VisibilityChanged': {
        const { instanceId, visible, success } = payload;
        if (success && instanceId !== undefined) {
          setObjectVisibility(prev => ({ ...prev, [instanceId]: visible }));
        }
        break;
      }

      case 'LockChanged': {
        const { instanceId, locked, success } = payload;
        if (success && instanceId !== undefined) {
          setObjectLocked(prev => ({ ...prev, [instanceId]: locked }));
        }
        break;
      }

      case 'ViewModeChanged':
        if (payload.mode === '2D' || payload.mode === '3D') {
          setViewMode(payload.mode);
        }
        break;

      case 'SnapChanged':
        setSnapEnabled(!!payload.enabled);
        break;

      case 'ToolChanged':
        if (payload.toolId) setSelectedTool(payload.toolId as EditorToolId);
        break;

      case 'LayoutSaved': {
        // Unity (or simulation) confirmed layout — persist to AsyncStorage + backend
        const { layout } = payload;
        if (layout?.items) {
          saveLayout(roomId ?? 'default', layout.items)
            .then(async () => {
              // Update the furniture count stored in the custom-room record
              if (roomId?.startsWith('custom_')) {
                await refreshFurnitureCount(roomId).catch(() => undefined);

                // Sync to backend if we have a backendImageId
                const room = await loadCustomRoom(roomId).catch(() => null);
                if (room?.backendImageId != null) {
                  const placements: PlacementItem[] = (layout.items as any[]).map((item: any) => ({
                    instanceId: item.instanceId ?? '',
                    catalogId:  item.catalogId  ?? '',
                    x:          item.position?.x ?? 0,
                    y:          item.position?.y ?? 0,
                    z:          item.position?.z ?? 0,
                    rotation:   item.rotationYDeg ?? 0,
                  }));
                  apiSyncLayout(room.backendImageId, placements)
                    .catch(e => console.warn('[Editor] Backend sync failed:', e));
                }
              }
            })
            .catch(e => console.warn('[Editor] Failed to persist layout:', e));
        }
        break;
      }

      case 'CollisionStatus': {
        // Unity reports whether the dragged furniture overlaps walls/other furniture.
        // RN can use this to show a warning badge — currently just logged.
        const { instanceId: cid, hasCollision } = payload;
        if (cid) {
          setCollisionState(prev => ({ ...prev, [cid]: !!hasCollision }));
          console.log(`[Editor] CollisionStatus: ${cid} → ${hasCollision ? '⛔ collision' : '✅ clear'}`);
        }
        break;
      }
    }
  };

  // Keep a stable ref so native Unity callbacks always invoke the latest handler,
  // avoiding stale-closure bugs when state updates asynchronously.
  const handleUnityEventRef = useRef(handleUnityEvent);
  useEffect(() => { handleUnityEventRef.current = handleUnityEvent; });

  const receiveFromUnity = useCallback((rawMessage: string) => {
    addLog('Unity → RN', 'event', rawMessage);
    const envelope = deserializeBridgeMessage(rawMessage);
    if (envelope?.kind === 'event') {
      handleUnityEventRef.current(envelope.name, envelope.payload as Record<string, any>);
    }
  }, []); // stable reference — reads fresh handler via ref

  /** Simulate Unity responses when running without a native Unity build. */
  const simulateUnityResponse = (cmd: UnityBridgeEnvelope) => {
    switch (cmd.name) {
      case 'LoadRoom':
        receiveFromUnity(serializeBridgeMessage(
          createMockUnityEvent(cmd.requestId, 'RoomLoaded', { roomId: 'replica_room0', success: true, simulated: true })
        ));
        break;

      case 'CreateProceduralRoom': {
        // Simulate the two events Unity would send back
        const p = cmd.payload as any;
        receiveFromUnity(serializeBridgeMessage(
          createMockUnityEvent(cmd.requestId, 'ProceduralRoomCreated', { roomId: p.roomId, success: true })
        ));
        receiveFromUnity(serializeBridgeMessage(
          createMockUnityEvent(cmd.requestId, 'RoomLoaded', { roomId: p.roomId, success: true, simulated: true })
        ));
        break;
      }

      case 'AddFurniture': {
        const p = (cmd.payload as any);
        receiveFromUnity(serializeBridgeMessage(
          createMockUnityEvent(cmd.requestId, 'FurnitureAdded', {
            instanceId: p.instanceId,
            success: true,
            isDuplicate: false,
            catalogId: p.catalogId,
            position: p.position ?? { x: 0, y: 0, z: 0 },
            rotationYDeg: 0,
            scale: 0.8,
          })
        ));
        break;
      }

      case 'DuplicateSelected': {
        if (!selectedInstanceId) break;
        const origTransform = objectTransforms[selectedInstanceId];
        const origPos = origTransform?.position ?? { x: 0, y: 0, z: 0 };
        const dupId   = nextInstanceId();
        const dupCat  = objectCatalogIds[selectedInstanceId] ?? selectedCatalogId;
        receiveFromUnity(serializeBridgeMessage(
          createMockUnityEvent(cmd.requestId, 'FurnitureAdded', {
            instanceId: dupId,
            success: true,
            isDuplicate: true,
            catalogId: dupCat,
            position: { x: origPos.x + 0.6, y: origPos.y, z: origPos.z + 0.6 },
            rotationYDeg: origTransform?.rotationYDeg ?? 0,
            scale: origTransform?.scale ?? 0.8,
          })
        ));
        break;
      }

      case 'SelectFurniture': {
        const p   = cmd.payload as any;
        const pos = objectTransforms[p.instanceId]?.position ?? { x: 0, y: 0, z: 0 };
        const ry  = objectTransforms[p.instanceId]?.rotationYDeg ?? 0;
        const sc  = objectTransforms[p.instanceId]?.scale ?? 0.8;
        receiveFromUnity(serializeBridgeMessage(
          createMockUnityEvent(cmd.requestId, 'FurnitureSelected', {
            instanceId: p.instanceId, success: true,
            position: pos, rotationYDeg: ry, scale: sc,
          })
        ));
        break;
      }

      case 'RotateSelected': {
        if (!selectedInstanceId) break;
        const prev = objectTransforms[selectedInstanceId];
        const ry   = ((prev?.rotationYDeg ?? 0) + ((cmd.payload as any).deltaDeg ?? 45)) % 360;
        receiveFromUnity(serializeBridgeMessage(
          createMockUnityEvent(cmd.requestId, 'FurnitureTransformed', {
            instanceId: selectedInstanceId, success: true,
            position: prev?.position ?? { x: 0, y: 0, z: 0 }, rotationYDeg: ry,
          })
        ));
        break;
      }

      case 'DeleteSelected': {
        if (!selectedInstanceId) break;
        const deletedId = selectedInstanceId;
        receiveFromUnity(serializeBridgeMessage(
          createMockUnityEvent(cmd.requestId, 'FurnitureDeleted', { instanceId: deletedId, success: true })
        ));
        break;
      }

      case 'SetObjectVisibility': {
        const p = cmd.payload as any;
        receiveFromUnity(serializeBridgeMessage(
          createMockUnityEvent(cmd.requestId, 'VisibilityChanged',
            { instanceId: p.instanceId, visible: p.visible, success: true })
        ));
        break;
      }

      case 'SetObjectLocked': {
        const p = cmd.payload as any;
        receiveFromUnity(serializeBridgeMessage(
          createMockUnityEvent(cmd.requestId, 'LockChanged',
            { instanceId: p.instanceId, locked: p.locked, success: true })
        ));
        break;
      }

      case 'SetActiveTool':
        receiveFromUnity(serializeBridgeMessage(
          createMockUnityEvent(cmd.requestId, 'ToolChanged',
            { toolId: (cmd.payload as any).toolId })
        ));
        break;

      case 'SetViewMode':
        receiveFromUnity(serializeBridgeMessage(
          createMockUnityEvent(cmd.requestId, 'ViewModeChanged',
            { mode: (cmd.payload as any).mode })
        ));
        break;

      case 'SetSnapEnabled':
        receiveFromUnity(serializeBridgeMessage(
          createMockUnityEvent(cmd.requestId, 'SnapChanged',
            { enabled: (cmd.payload as any).enabled })
        ));
        break;

      case 'SaveLayout':
        receiveFromUnity(serializeBridgeMessage(
          createMockUnityEvent(cmd.requestId, 'LayoutSaved', {
            layout: {
              schemaVersion: 'layout-json/v1',
              layoutId: 'mock_layout_0001',
              roomId: 'replica_room0',
              items: addedInstanceIds.map(id => ({
                instanceId: id,
                catalogId: objectCatalogIds[id] ?? ALL_FURNITURE[0].id,
                position: objectTransforms[id]?.position ?? { x: 0, y: 0, z: 0 },
                rotationYDeg: objectTransforms[id]?.rotationYDeg ?? 0,
                scale: objectTransforms[id]?.scale ?? 0.8,
                visible: objectVisibility[id] ?? true,
                locked:  objectLocked[id]    ?? false,
              })),
            },
          })
        ));
        break;

      case 'UndoAction':
        receiveFromUnity(serializeBridgeMessage(
          createMockUnityEvent(cmd.requestId, 'UndoResult',
            { success: false, reason: 'undo_not_implemented' })
        ));
        break;

      case 'RedoAction':
        receiveFromUnity(serializeBridgeMessage(
          createMockUnityEvent(cmd.requestId, 'RedoResult',
            { success: false, reason: 'redo_not_implemented' })
        ));
        break;
    }
  };

  const clearLoadRoomTimer = () => {
    if (unityFallbackTimer.current) {
      clearTimeout(unityFallbackTimer.current);
      unityFallbackTimer.current = null;
    }
  };

  const postToNativeUnity = (cmd: UnityBridgeEnvelope) => {
    const msg = serializeBridgeMessage(cmd);
    addLog('RN → Unity', cmd.name, msg);
    if (!UnityView || !unityRef.current) return false;

    unityRef.current.postMessage(UNITY_GAME_OBJECT, UNITY_RECEIVE_METHOD, msg);
    return true;
  };

  const scheduleLoadRoomRetry = () => {
    if (loadRoomPostedToReadyBridge.current) return;

    clearLoadRoomTimer();
    unityFallbackTimer.current = setTimeout(() => {
      const pending = pendingLoadRoomCmd.current;
      if (!pending) return;

      if (unityBridgeReady.current) {
        loadRoomPostedToReadyBridge.current = postToNativeUnity(pending);
        unityFallbackTimer.current = null;
        return;
      }

      if (UnityView && loadRoomRetryCount.current < LOAD_ROOM_MAX_RETRIES) {
        loadRoomRetryCount.current += 1;
        postToNativeUnity(pending);
        scheduleLoadRoomRetry();
        return;
      }

      simulateUnityResponse(pending);
      pendingLoadRoomCmd.current = null;
      loadRoomRetryCount.current = 0;
      loadRoomPostedToReadyBridge.current = false;
      unityFallbackTimer.current = null;
    }, LOAD_ROOM_RETRY_DELAY_MS);
  };

  const sendToUnity = (cmd: UnityBridgeEnvelope) => {
    const posted = postToNativeUnity(cmd);

    if (cmd.name === 'LoadRoom') {
      pendingLoadRoomCmd.current = cmd;
      loadRoomPostedToReadyBridge.current = posted && unityBridgeReady.current;
      loadRoomRetryCount.current = posted ? 0 : 1;

      if (UnityView && !loadRoomPostedToReadyBridge.current) {
        scheduleLoadRoomRetry();
      } else {
        if (!UnityView) simulateUnityResponse(cmd);
      }
      return;
    }

    if (!posted) simulateUnityResponse(cmd);
    return;
  };

  const createCurrentRoomLoadCommand = () => {
    const room = roomId ? MY_ROOMS.find(r => r.id === roomId) : MY_ROOMS[0];
    if (!room?.glbPath) return createMockRoomPayload();

    return createRoomPayload({
      roomId:               room.deliveryManifestPath ? `local_delivery_${room.id}` : `replica_cad_${room.id}`,
      meshUri:              room.glbPath,
      sceneInstancePath:    room.sceneJsonPath,
      objectsBasePath:      room.objectsBasePath,
      deliveryManifestPath: room.deliveryManifestPath,
      bounds:               room.deliveryManifestPath ? LOCAL_ROOM1_BOUNDS : undefined,
    });
  };

  const handleAddFurniture = (catalogId = selectedCatalogId) => {
    const id  = nextInstanceId();
    const x   = (Math.random() - 0.5) * 4;
    const z   = (Math.random() - 0.5) * 4;
    const pos = { x, y: 0, z };
    // Optimistic: track locally before Unity confirms
    setAddedInstanceIds(prev => [...prev, id]);
    setObjectCatalogIds(prev => ({ ...prev, [id]: catalogId }));
    setObjectTransforms(prev => ({
      ...prev,
      [id]: { position: pos, rotationYDeg: 0, scale: 0.8 },
    }));
    setSelectedInstanceId(id);
    sendToUnity(createAddFurniturePayload(id, catalogId, pos));
    setActiveTab('object');
    setShowObjectDetail(true);
    snapTo(1);
  };

  const handleSelectItem = (id: string) => {
    setSelectedInstanceId(id);
    setShowObjectDetail(true);
    sendToUnity(createSelectFurniturePayload(id));
  };

  const handleRotate = () => {
    if (!selectedInstanceId) return;
    sendToUnity(createRotateSelectedPayload(45));
  };

  const handleDelete = () => {
    if (!selectedInstanceId) return;
    // Optimistic local removal (Unity confirms via FurnitureDeleted)
    const id = selectedInstanceId;
    setAddedInstanceIds(prev => prev.filter(x => x !== id));
    setSelectedInstanceId(null);
    setShowObjectDetail(false);
    sendToUnity(createDeleteSelectedPayload());
  };

  const handleDuplicate = () => {
    if (!selectedInstanceId) return;
    sendToUnity(createDuplicateSelectedPayload());
  };

  const handleToggleVisibility = (instanceId: string) => {
    const visible = !(objectVisibility[instanceId] ?? true);
    // Optimistic
    setObjectVisibility(prev => ({ ...prev, [instanceId]: visible }));
    sendToUnity(createSetVisibilityPayload(instanceId, visible));
  };

  const handleToggleLocked = (instanceId: string) => {
    const locked = !(objectLocked[instanceId] ?? false);
    // Optimistic
    setObjectLocked(prev => ({ ...prev, [instanceId]: locked }));
    sendToUnity(createSetLockedPayload(instanceId, locked));
  };

  const handleUndo = () => sendToUnity(createUndoPayload());
  const handleRedo = () => sendToUnity(createRedoPayload());

  const handleViewModeToggle = () => {
    const next: '2D' | '3D' = viewMode === '3D' ? '2D' : '3D';
    sendToUnity(createSetViewModePayload(next));
    // Optimistic (confirmed via ViewModeChanged event)
    setViewMode(next);
  };

  const handleSnapToggle = () => {
    const next = !snapEnabled;
    sendToUnity(createSetSnapPayload(next));
    setSnapEnabled(next);
  };

  const handleToolTap = (tool: EditorToolId) => {
    sendToUnity(createSetActiveToolPayload(tool));

    // Persistent drag-mode tools stay highlighted
    if (tool === 'select' || tool === 'move' || tool === 'scale') {
      setSelectedTool(tool);
      return;
    }

    // One-shot actions: fire then revert highlight back to 'select'
    if (tool === 'rotate')    handleRotate();
    if (tool === 'delete')    handleDelete();
    if (tool === 'duplicate') handleDuplicate();
    sendToUnity(createSetActiveToolPayload('select'));
    setSelectedTool('select');
  };

  const handleReset = () => {
    const reloadCommand = createCurrentRoomLoadCommand();
    sendToUnity(createResetEditorPayload());
    setAddedInstanceIds([]);
    setSelectedInstanceId(null);
    setShowObjectDetail(false);
    setObjectTransforms({});
    setObjectVisibility({});
    setObjectLocked({});
    setObjectCatalogIds({});
    setCollisionState({});
    furnitureCounter = 0;
    layoutRestoredRef.current = false;
    setUnityConnected(false);
    setTimeout(() => sendToUnity(reloadCommand), 100);
  };

  // ── Restore persisted layout once Unity confirms the room is loaded ──────
  useEffect(() => {
    if (!unityConnected || layoutRestoredRef.current) return;
    const room = roomId ? MY_ROOMS.find(r => r.id === roomId) : MY_ROOMS[0];
    if (room?.deliveryManifestPath) return;
    layoutRestoredRef.current = true;

    const roomKey = roomId ?? 'default';
    loadLayout(roomKey).then(saved => {
      if (!saved || saved.items.length === 0) return;
      console.log(`[Editor] Restoring ${saved.items.length} furniture items for "${roomKey}"`);
      saved.items.forEach(item => {
        // Mirror state optimistically
        setAddedInstanceIds(prev =>
          prev.includes(item.instanceId) ? prev : [...prev, item.instanceId]
        );
        setObjectCatalogIds(prev => ({ ...prev, [item.instanceId]: item.catalogId }));
        setObjectTransforms(prev => ({
          ...prev,
          [item.instanceId]: {
            position:     item.position,
            rotationYDeg: item.rotationYDeg,
            scale:        item.scale,
          },
        }));
        // Send to Unity so the 3D object is spawned at the saved position
        sendToUnity(createAddFurniturePayload(item.instanceId, item.catalogId, item.position));
      });
    });
  // sendToUnity is safe here: this effect captures the post-render closure
  // where both unityRef and unityView are fully initialised.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unityConnected]);

  // Cleanup fallback timer on unmount
  useEffect(() => {
    return () => {
      if (unityFallbackTimer.current) clearTimeout(unityFallbackTimer.current);
    };
  }, []);

  useEffect(() => {
    // ── Custom (procedural) room ───────────────────────────────────────────
    if (roomId?.startsWith('custom_')) {
      loadRoomSpec(roomId).then(spec => {
        if (spec) {
          setCustomRoomSpec(spec);
          sendToUnity(createProceduralRoomPayload(spec));
        } else {
          // Spec missing (shouldn't happen normally) — fall back to mock
          console.warn('[Editor] No spec found for custom room:', roomId);
          sendToUnity(createMockRoomPayload());
        }
      });
      return;
    }

    // ── Preset GLB room ────────────────────────────────────────────────────
    sendToUnity(createCurrentRoomLoadCommand());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived data
  // ─────────────────────────────────────────────────────────────────────────

  const objectListItems = addedInstanceIds.map((id, i) => {
    const catItem = ALL_FURNITURE.find(f => f.id === objectCatalogIds[id]);
    return {
      instanceId: id,
      name:      `${catItem?.name ?? '가구'} ${i + 1}`,
      type:      catItem?.type ?? '가구',
      thumbnail: catItem?.thumbnail ?? '🪑',
      color:     catItem?.color ?? '#EAE8FF',
      hasCollision: collisionState[id] ?? false,
    };
  });

  const selectedObjIndex = selectedInstanceId
    ? addedInstanceIds.indexOf(selectedInstanceId)
    : -1;

  const selectedTransform: TransformState = selectedInstanceId
    ? (objectTransforms[selectedInstanceId] ?? { position: { x: 0, y: 0, z: 0 }, rotationYDeg: 0, scale: 0.8 })
    : { position: { x: 0, y: 0, z: 0 }, rotationYDeg: 0, scale: 0.8 };

  // Derived overlay positions
  const toolbarTop   = (SNAP[1] - HEADER_H) / 2 - 108 + 8;
  

  // ─────────────────────────────────────────────────────────────────────────
  // Tab content renderers
  // ─────────────────────────────────────────────────────────────────────────

  const renderObjectTab = () => {
    if (showObjectDetail && selectedInstanceId && selectedObjIndex >= 0) {
      const pos = selectedTransform.position;
      const ry  = selectedTransform.rotationYDeg;
      const sc  = selectedTransform.scale;
      const selCatItem = ALL_FURNITURE.find(f => f.id === objectCatalogIds[selectedInstanceId]);

      return (
        <View style={s.tabContent}>
          <TouchableOpacity
            style={s.backRow} activeOpacity={0.7}
            onPress={() => setShowObjectDetail(false)}
          >
            <Feather name="chevron-left" size={14} color={PRIMARY} />
            <Text style={s.backText}>객체 리스트</Text>
          </TouchableOpacity>
          <Text style={s.sectionLabel}>선택된 객체</Text>

          <View style={s.detailHeaderRow}>
            <View style={[s.thumbLg, { backgroundColor: `${selCatItem?.color ?? '#EAE8FF'}30` }]}>
              <Text style={{ fontSize: 26 }}>{selCatItem?.thumbnail ?? '🪑'}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={s.detailName}>
                  {selCatItem?.name ?? '가구'} {selectedObjIndex + 1}
                </Text>
                <Feather name="edit-2" size={11} color={N400} />
              </View>
              <Text style={s.detailSub}>{selCatItem?.type ?? '가구'} · {selCatItem?.dimensions ?? ''}</Text>
              <Text style={s.detailSub}>ID: {selectedInstanceId.slice(0, 16)}</Text>
              {collisionState[selectedInstanceId] && (
                <Text style={[s.detailSub, { color: RED, fontWeight: '600' }]}>Collision detected</Text>
              )}
            </View>
            <View style={{ alignItems: 'center', gap: 2 }}>
              <TouchableOpacity style={s.actionBtn} onPress={handleDuplicate}>
                <Feather name="copy" size={16} color={N700} />
              </TouchableOpacity>
              <Text style={s.actionLabel}>복제</Text>
            </View>
            <View style={{ alignItems: 'center', gap: 2 }}>
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: '#FEF2F2' }]}
                onPress={handleDelete}
              >
                <Feather name="trash-2" size={16} color={RED} />
              </TouchableOpacity>
              <Text style={[s.actionLabel, { color: RED }]}>삭제</Text>
            </View>
          </View>

          {/* Real transform data from Unity */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['위치', '회전', '크기'] as const).map((title, ti) => (
              <View key={title} style={s.transformCol}>
                <Text style={s.transformTitle}>{title}</Text>
                {(['X', 'Y', 'Z'] as const).map((axis, ai) => {
                  let val: string;
                  if (ti === 0)      val = [pos.x, pos.y, pos.z][ai].toFixed(2);
                  else if (ti === 1) val = ['0', ry.toFixed(1), '0'][ai];
                  else               val = [sc, sc, sc][ai].toFixed(2);
                  return (
                    <View key={axis} style={s.transformRow}>
                      <Text style={[s.transformAxis,
                        { color: ai === 0 ? RED : ai === 1 ? '#22C55E' : PRIMARY }]}>{axis}</Text>
                      <Text style={s.transformVal}>{val}</Text>
                      <Feather name="lock" size={10} color={N300} />
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      );
    }

    return (
      <View style={s.tabContent}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={[s.searchBox, { flex: 1 }]}>
            <Feather name="search" size={16} color={N400} />
            <Text style={s.searchPlaceholder}>객체 검색</Text>
          </View>
          <View style={s.filterBtn}>
            <Feather name="sliders" size={16} color={N600} />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 2 }}>
            {['전체', '가구', '조명', '장식'].map((c, i) => (
              <View key={c} style={[s.pill, i === 0 && s.pillActive]}>
                <Text style={[s.pillText, i === 0 && s.pillTextActive]}>{c}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <Text style={s.countLabel}>배치된 객체 · {objectListItems.length}</Text>

        {objectListItems.length === 0 ? (
          <Text style={s.emptyText}>아직 배치된 객체가 없습니다.{'\n'}추가 탭에서 아이템을 배치해보세요.</Text>
        ) : (
          objectListItems.map(o => {
            const visible  = objectVisibility[o.instanceId] ?? true;
            const locked   = objectLocked[o.instanceId]    ?? false;
            const isSelected = o.instanceId === selectedInstanceId;
            return (
              <TouchableOpacity
                key={o.instanceId}
                style={[s.listRow, isSelected && { borderColor: PRIMARY }]}
                activeOpacity={0.75}
                onPress={() => handleSelectItem(o.instanceId)}
              >
                <View style={[s.thumbSm, { backgroundColor: `${o.color}30` }]}>
                  <Text style={{ fontSize: 18 }}>{o.thumbnail}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.listRowName}>{o.name}</Text>
                  <Text style={s.listRowSub}>{o.type}</Text>
                </View>
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => handleToggleVisibility(o.instanceId)}
                >
                  <Feather
                    name={visible ? 'eye' : 'eye-off'}
                    size={16}
                    color={visible ? N500 : N300}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ marginLeft: 6 }}
                  onPress={() => handleToggleLocked(o.instanceId)}
                >
                  <Feather name="lock" size={16} color={locked ? N700 : N300} />
                </TouchableOpacity>
                {o.hasCollision && (
                  <Feather name="alert-triangle" size={15} color={RED} />
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>
    );
  };

  const renderAddTab = () => {
    if (showAddDetail) {
      const item   = ALL_FURNITURE.find(f => f.id === selectedCatalogId) ?? ALL_FURNITURE[0];
      const matKey = item.id;
      const matIdx = activeMat[matKey] ?? 0;

      return (
        <View style={s.tabContent}>
          <TouchableOpacity style={s.backRow} activeOpacity={0.7} onPress={() => setShowAddDetail(false)}>
            <Feather name="chevron-left" size={14} color={PRIMARY} />
            <Text style={s.backText}>추가 리스트</Text>
          </TouchableOpacity>

          <View style={s.detailHeaderRow}>
            <View style={[s.thumbLg, { backgroundColor: `${item.color}30` }]}>
              <Text style={{ fontSize: 28 }}>{item.thumbnail}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.detailName}>{item.name}</Text>
              <Text style={s.detailSub}>{item.type} · {item.dimensions}</Text>
              <Text style={[s.detailSub, { color: PRIMARY, fontWeight: '600' }]}>{item.price}</Text>
            </View>
          </View>

          {/* Preview area — emoji-based since we have no 3D model yet */}
          <View style={s.previewArea}>
            <View style={[s.previewEmoji, { backgroundColor: `${item.color}18` }]}>
              <Text style={{ fontSize: 72 }}>{item.thumbnail}</Text>
            </View>
            <View style={s.previewTag}><Text style={{ fontSize: 10, color: N500 }}>미리보기</Text></View>
            <View style={[s.previewTag, { left: 'auto', right: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
              <Feather name="star" size={9} color="#FBBF24" />
              <Text style={{ fontSize: 10, color: N500 }}>{item.rating}</Text>
            </View>
          </View>

          {/* Material selector (visual only in P1) */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['우드', '패브릭', '메탈'].map((m, i) => (
              <TouchableOpacity
                key={m}
                style={[s.matBtn, i === matIdx && s.matBtnActive]}
                activeOpacity={0.75}
                onPress={() => setActiveMat(prev => ({ ...prev, [matKey]: i }))}
              >
                <Text style={[s.matBtnText, i === matIdx && s.matBtnTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={s.addBtn}
            activeOpacity={0.86}
            onPress={() => {
              handleAddFurniture(item.id);
              setShowAddDetail(false);
            }}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={s.addBtnText}>룸에 추가하기</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // ── List view ──────────────────────────────────────────────────────────────
    const catType = EDITOR_CATS[catFilter]?.type;
    const filtered: FurnitureItem[] =
      catType === null
        ? ALL_FURNITURE
        : catType === 'myFurniture'
          ? ALL_FURNITURE.filter(f => f.isMyFurniture)
          : ALL_FURNITURE.filter(f => !f.isMyFurniture && f.type === catType);

    return (
      <View style={s.tabContent}>
        <View style={s.searchBox}>
          <Feather name="search" size={16} color={N400} />
          <Text style={s.searchPlaceholder}>아이템 검색</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 2 }}>
            {EDITOR_CATS.map((c, i) => (
              <TouchableOpacity
                key={c.label}
                style={[s.pill, i === catFilter && s.pillActive]}
                activeOpacity={0.7}
                onPress={() => setCatFilter(i)}
              >
                <Text style={[s.pillText, i === catFilter && s.pillTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {filtered.map(item => (
            <TouchableOpacity
              key={item.id}
              style={{ width: CATALOG_W }}
              activeOpacity={0.75}
              onPress={() => { setSelectedCatalogId(item.id); setShowAddDetail(true); }}
            >
              <View style={[s.catalogThumb, { backgroundColor: `${item.color}30` }]}>
                <Text style={{ fontSize: 34 }}>{item.thumbnail}</Text>
                {item.isMyFurniture && (
                  <View style={s.myFurnitureBadge}>
                    <Text style={s.myFurnitureBadgeText}>내 가구</Text>
                  </View>
                )}
              </View>
              <Text style={s.catalogName} numberOfLines={1}>{item.name}</Text>
              <Text style={s.catalogPrice}>{item.price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderStructureTab = () => {
    if (showStructureDetail) {
      const matIdx = activeMat['structure'] ?? 0;
      const colors = ['#FFFFFF', '#E7E2D8', '#C9B79C', '#7A8A99', '#2F3A4A'];
      return (
        <View style={s.tabContent}>
          <TouchableOpacity style={s.backRow} activeOpacity={0.7} onPress={() => setShowStructureDetail(false)}>
            <Feather name="chevron-left" size={14} color={PRIMARY} />
            <Text style={s.backText}>구조 리스트</Text>
          </TouchableOpacity>

          <View style={[s.listRow, { borderWidth: 2, borderColor: PRIMARY }]}>
            <View style={[s.thumbSm, { width: 48, height: 48 }]}>
              <Feather name="square" size={20} color={PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.listRowName}>벽 · North</Text>
              <Text style={{ fontSize: 11, color: PRIMARY }}>선택됨</Text>
            </View>
          </View>

          <Text style={s.sectionLabel}>재질</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['페인트', '벽지', '타일'].map((m, i) => (
              <TouchableOpacity
                key={m}
                style={[s.matBtn, i === matIdx && s.matBtnActive]}
                activeOpacity={0.75}
                onPress={() => setActiveMat(prev => ({ ...prev, structure: i }))}
              >
                <Text style={[s.matBtnText, i === matIdx && s.matBtnTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.sectionLabel}>색상</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {colors.map((c, i) => (
              <View key={c} style={[
                s.colorSwatch, { backgroundColor: c },
                i === 1 && { borderColor: PRIMARY, borderWidth: 2 },
              ]} />
            ))}
          </View>

          <View style={s.fieldCard}>
            {[['두께', '120', 'mm'], ['높이', '2.70', 'm'], ['길이', '4.20', 'm']].map(
              ([label, val, unit], i, arr) => (
                <View key={label} style={[
                  s.fieldRow,
                  i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: N200 },
                ]}>
                  <Text style={s.fieldLabel}>{label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    <Text style={s.fieldValue}>{val}</Text>
                    <Text style={s.fieldUnit}>{unit}</Text>
                  </View>
                </View>
              )
            )}
          </View>
        </View>
      );
    }

    return (
      <View style={s.tabContent}>
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>룸 요약</Text>
          <View style={{ flexDirection: 'row', gap: 20, marginTop: 4 }}>
            {[['4.20 × 3.60', '크기 (m)'], ['15.1', '면적 (㎡)'], ['2.7', '높이 (m)']].map(
              ([val, unit]) => (
                <View key={unit}>
                  <Text style={s.summaryValue}>{val}</Text>
                  <Text style={s.summaryUnit}>{unit}</Text>
                </View>
              )
            )}
          </View>
        </View>

        {STRUCTURE_ITEMS.map(({ label, count, icon }) => (
          <TouchableOpacity key={label} style={s.listRow} activeOpacity={0.75}
            onPress={() => setShowStructureDetail(true)}>
            <View style={[s.thumbSm, { width: 36, height: 36, borderRadius: 8 }]}>
              <Feather name={icon as any} size={16} color={N600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.listRowName}>{label}</Text>
              <Text style={s.listRowSub}>{count}개</Text>
            </View>
            <Feather name="chevron-right" size={16} color={N300} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <LinearGradient colors={['#F4F6FA', '#E8ECF3']} style={StyleSheet.absoluteFillObject} />

      {/* Unity view or placeholder — full screen, z=0 */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 0 }]}>
        {/* Native Unity player (only when module is available) */}
        {UnityView && (
          <UnityView
            ref={unityRef}
            style={StyleSheet.absoluteFill}
            fullScreen
            onUnityMessage={(e: UnityMessageEvent) => receiveFromUnity(e.nativeEvent.message)}
          />
        )}

        {/* 2-D simulation floor plan:
            – always shown when no native Unity module (Expo Go / web)
            – shown on top of Unity while we wait for RoomLoaded confirmation
            – hidden (opacity 0) once Unity confirms the room is rendered        */}
        {!unityConnected && (
          <SimulationFloorPlan
            room={
              // For custom rooms show a procedural placeholder; for presets
              // use the real MY_ROOMS record (with heroImage, furniture dots…).
              roomId?.startsWith('custom_') && customRoomSpec
                ? ({
                    id:             roomId,
                    name:           customRoomSpec.name,
                    area:           `${(customRoomSpec.width * customRoomSpec.length).toFixed(1)}㎡`,
                    furniture:      [],   // no static furniture for procedural rooms
                    heroImage:      '',
                    realPhotos:     [],
                    isFeatured:     false,
                    glbPath:        '',
                    sceneJsonPath:  '',
                    objectsBasePath:'',
                    lastEdited:     '',
                    furnitureCount: 0,
                  } as unknown as RoomProject)
                : (MY_ROOMS.find(r => r.id === roomId) ?? MY_ROOMS[0])
            }
            isConnecting={!!UnityView}
          />
        )}
      </View>

      {/* Viewport overlays — z=10 */}
      <View
        style={[StyleSheet.absoluteFill, { zIndex: 10, top: HEADER_H }]}
        pointerEvents="box-none"
      >
        {/* Top control row */}
        <View style={s.vpTopRow} pointerEvents="box-none">
          {/* 2D / 3D toggle */}
          <View style={s.toggleGroup} pointerEvents="auto">
            <TouchableOpacity
              style={viewMode === '2D' ? s.toggleOn : s.toggleOff}
              onPress={handleViewModeToggle}
            >
              <Text style={viewMode === '2D' ? s.toggleOnText : s.toggleOffText}>2D</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={viewMode === '3D' ? s.toggleOn : s.toggleOff}
              onPress={handleViewModeToggle}
            >
              <Text style={viewMode === '3D' ? s.toggleOnText : s.toggleOffText}>3D</Text>
            </TouchableOpacity>
          </View>

          {/* Right controls */}
          <View style={s.vpRightControls} pointerEvents="auto">
                        <TouchableOpacity
              style={[s.vpChip, snapEnabled && { backgroundColor: PRIMARY_LIGHT, borderColor: PRIMARY }]}
              onPress={handleSnapToggle}
            >
              <Text style={[s.vpChipText, snapEnabled && { color: PRIMARY }]}>🧲 스냅</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.vpIconBtn} onPress={handleUndo}>
              <Feather name="rotate-ccw" size={16} color={N700} />
            </TouchableOpacity>
            <TouchableOpacity style={s.vpIconBtn} onPress={handleRedo}>
              <Feather name="rotate-cw" size={16} color={N700} />
            </TouchableOpacity>
            <TouchableOpacity style={s.vpIconBtn} onPress={handleReset}>
              <Feather name="more-horizontal" size={16} color={N700} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Left toolbar */}
        <View pointerEvents="auto" style={[s.leftToolbar, { top: toolbarTop }]}>
          {TOOLS.map(({ id, label, icon }) => {
            const active = id === selectedTool;
            return (
              <TouchableOpacity
                key={id}
                style={[s.toolBtn, active && s.toolBtnActive]}
                activeOpacity={0.75}
                onPress={() => handleToolTap(id)}
              >
                <Feather name={icon as any} size={12} color={active ? '#fff' : N700} />
                <Text style={[s.toolLabel, active && s.toolLabelActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Header — solid white, z=30 */}
      <View style={[s.header, { height: HEADER_H, paddingTop: insets.top, zIndex: 30 }]}>
        <TouchableOpacity style={s.headerBackBtn} onPress={onBack} activeOpacity={0.75}>
          <Feather name="chevron-left" size={22} color={N900} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>룸 편집</Text>
          {editingRoomName ? (
            <TextInput
              style={s.headerSubInput}
              value={roomDisplayName}
              onChangeText={setRoomDisplayName}
              onBlur={() => setEditingRoomName(false)}
              onSubmitEditing={() => setEditingRoomName(false)}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
            />
          ) : (
            <TouchableOpacity style={s.headerSubRow} onPress={() => setEditingRoomName(true)} activeOpacity={0.7}>
              <Text style={s.headerSubText}>{roomDisplayName}</Text>
              <Feather name="edit-2" size={10} color={N400} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={s.headerSaveBtn} activeOpacity={0.75}
          onPress={() => sendToUnity(createSaveLayoutPayload())}
        >
          <Feather name="save" size={17} color={N600} />
        </TouchableOpacity>
      </View>

      {/* Bottom sheet — z=20 */}
      <Animated.View style={[s.sheet, { top: sheetTopAnim, zIndex: 20 }]}>
        <View style={s.handleArea} {...panResponder.panHandlers}>
          <View style={s.handlePill} />
        </View>

        <View style={s.tabsRow}>
          {(['object', 'add', 'structure'] as ActiveTab[]).map((tab, i) => {
            const labels  = ['객체', '추가', '구조'];
            const isActive = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab} style={s.tabItem} activeOpacity={0.7}
                onPress={() => { setActiveTab(tab); if (tab !== activeTab) snapTo(1); }}
              >
                <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{labels[i]}</Text>
                {isActive && <View style={s.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'object'    && renderObjectTab()}
          {activeTab === 'add'       && renderAddTab()}
          {activeTab === 'structure' && renderStructureTab()}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

// ─── Simulation floor plan ────────────────────────────────────────────────────
// Shown when Unity isn't connected (Expo Go, simulator without GLB files).
// Renders the room's actual furniture data as a 2-D top-down floor plan.
// When isConnecting=true, a "connecting…" badge is overlaid to indicate
// the native Unity player IS present but the room hasn't loaded yet.
function SimulationFloorPlan({
  room,
  isConnecting = false,
}: {
  room: RoomProject;
  isConnecting?: boolean;
}) {
  // Floor plan lives in the upper portion of the screen; match the Unity viewport area
  const { width: W, height: H } = Dimensions.get('window');
  const FP_PAD = 28;          // padding inside the plan frame
  const FP_W   = W - FP_PAD * 2;
  const FP_H   = Math.round(FP_W * 1.05); // slightly taller than wide (portrait room)
  const FP_TOP = Math.round(H * 0.06);    // leave space for the fixed header

  // Convert furniture's (x%,y%) → SVG pixel coords inside the frame
  const px = (xPct: number) => (xPct / 100) * FP_W;
  const py = (yPct: number) => (yPct / 100) * FP_H;

  // Colour palette for furniture dots
  const DOT_COLORS = ['#C7D2FE', '#BBF7D0', '#FDE68A', '#FECACA', '#E9D5FF', '#BAE6FD'];

  return (
    <View style={[StyleSheet.absoluteFill, sim.container]}>
      {/* Grid background */}
      <Svg style={StyleSheet.absoluteFill} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <Pattern id="fpgrid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <Path d="M 24 0 L 0 0 0 24" fill="none" stroke="#E2E8F0" strokeWidth="0.8" />
          </Pattern>
        </Defs>
        <Rect width={W} height={H} fill="url(#fpgrid)" />
      </Svg>

      {/* Floor plan frame */}
      <View style={[sim.planFrame, { top: FP_TOP, left: FP_PAD, width: FP_W, height: FP_H }]}>
        {/* Room outline */}
        <Svg width={FP_W} height={FP_H} viewBox={`0 0 ${FP_W} ${FP_H}`}>
          {/* Floor fill */}
          <Rect x="0" y="0" width={FP_W} height={FP_H} fill="#F8F9FB" rx="4" />
          {/* Walls */}
          <Rect x="0" y="0" width={FP_W} height={FP_H} fill="none"
            stroke="#94A3B8" strokeWidth="3" rx="4" />
          {/* Door hint (bottom-left) */}
          <Path
            d={`M ${Math.round(FP_W * 0.1)} ${FP_H} A ${Math.round(FP_W * 0.1)} ${Math.round(FP_W * 0.1)} 0 0 1 ${Math.round(FP_W * 0.1)} ${Math.round(FP_H - FP_W * 0.1)}`}
            fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4,3"
          />

          {/* Furniture dots */}
          {room.furniture.map((item, i) => {
            const cx = px(item.x);
            const cy = py(item.y);
            const r  = 10;
            const col = DOT_COLORS[i % DOT_COLORS.length];
            return (
              <React.Fragment key={item.id}>
                {/* Dot */}
                <Rect
                  x={cx - r} y={cy - r} width={r * 2} height={r * 2}
                  rx={4} fill={col} stroke="#CBD5E1" strokeWidth="1"
                />
              </React.Fragment>
            );
          })}
        </Svg>

        {/* Furniture emoji labels — rendered as RN views so emoji font works */}
        {room.furniture.map((item, i) => (
          <View
            key={item.id}
            style={[sim.emojiDot, { left: px(item.x) - 10, top: py(item.y) - 12 }]}
            pointerEvents="none"
          >
            <Text style={sim.emoji}>{item.thumbnail}</Text>
          </View>
        ))}

        {/* Room area badge */}
        <View style={sim.areaBadge}>
          <Text style={sim.areaBadgeText}>{room.name}  {room.area}</Text>
        </View>
      </View>

      {/* Status badge */}
      <View style={sim.statusBadge}>
        <View style={[sim.dot, { backgroundColor: isConnecting ? '#FBBF24' : '#94A3B8' }]} />
        <Text style={sim.statusText}>
          {isConnecting ? 'Unity 연결 중…' : '시뮬레이션 모드'}
        </Text>
      </View>

      {/* Hint */}
      <View style={sim.hint}>
        <Text style={sim.hintText}>
          {isConnecting
            ? '3D 뷰 로딩 중 — GLB 경로가 기기에서 접근 가능한지 확인하세요'
            : '네이티브 빌드에서 Unity 3D 뷰가 표시됩니다'}
        </Text>
      </View>
    </View>
  );
}

const sim = StyleSheet.create({
  container:   { backgroundColor: '#F1F5F9' },
  planFrame:   {
    position: 'absolute',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  emojiDot:    { position: 'absolute', width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  emoji:       { fontSize: 11 },
  areaBadge:   {
    position: 'absolute', bottom: 6, right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  areaBadgeText: { fontSize: 10, fontWeight: '600', color: '#334155' },
  statusBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  dot:         { width: 6, height: 6, borderRadius: 3 },
  statusText:  { fontSize: 11, fontWeight: '600', color: '#475569' },
  hint:        {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center',
  },
  hintText:    { fontSize: 11, color: '#64748B', textAlign: 'center', lineHeight: 16 },
});

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F6FA' },

  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 4,
  },
  headerBackBtn: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerCenter:  { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 8 },
  headerTitle:   { fontSize: 15, fontWeight: '600', color: N900 },
  headerSubRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  headerSubText: { fontSize: 10, color: N500 },
  headerSubInput: { fontSize: 10, color: N700, borderBottomWidth: 1, borderBottomColor: PRIMARY, marginTop: 2, minWidth: 80, padding: 0 },
  headerSaveBtn: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },

  vpTopRow: {
    position: 'absolute', top: 8, left: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  toggleGroup: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 999,
    borderWidth: 1, borderColor: N200, padding: 2,
  },
  toggleOn:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: PRIMARY },
  toggleOff:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  toggleOnText:   { fontSize: 11, color: '#fff', fontWeight: '600' },
  toggleOffText:  { fontSize: 11, color: N500 },
  vpRightControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vpChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderRadius: 999, borderWidth: 1, borderColor: N200,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  vpChipText: { fontSize: 11, color: N700 },
  vpIconBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff', borderWidth: 1, borderColor: N200,
    alignItems: 'center', justifyContent: 'center',
  },

  leftToolbar: {
    position: 'absolute', left: 8,
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: N200, padding: 2, gap: 2,
  },
  toolBtn:        { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 1 },
  toolBtnActive:  { backgroundColor: PRIMARY },
  toolLabel:      { fontSize: 8, color: N700 },
  toolLabelActive: { color: '#fff' },

  minimap: {
    position: 'absolute', right: 8,
    width: 84, height: 84,
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: N200, overflow: 'hidden',
  },
  minimapInner:    { position: 'absolute', top: 4, left: 4, right: 4, bottom: 4, backgroundColor: N100, borderRadius: 6 },
  minimapBorder:   { position: 'absolute', top: 6, left: 6, right: 6, bottom: 6, borderWidth: 1, borderColor: N300, borderRadius: 2 },
  minimapObj:      { position: 'absolute', backgroundColor: N300, borderRadius: 2 },
  minimapSelected: { position: 'absolute', borderWidth: 1.5, borderColor: PRIMARY, backgroundColor: 'rgba(74,58,255,0.18)', borderRadius: 2 },

  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderTopColor: N100,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 16,
  },
  handleArea: { paddingTop: 8, paddingBottom: 4, alignItems: 'center' },
  handlePill: { width: 36, height: 4, borderRadius: 2, backgroundColor: N300 },

  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: N100 },
  tabItem:      { flex: 1, alignItems: 'center', paddingTop: 4, paddingBottom: 10, position: 'relative' },
  tabLabel:     { fontSize: 14, color: N400 },
  tabLabelActive: { color: PRIMARY },
  tabIndicator: { position: 'absolute', bottom: -1, left: '30%', right: '30%', height: 2, borderRadius: 1, backgroundColor: PRIMARY },

  tabContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 80, gap: 10 },

  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: N100, borderRadius: 12, paddingHorizontal: 12, height: 36 },
  searchPlaceholder: { fontSize: 13, color: N400 },
  filterBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: N100, alignItems: 'center', justifyContent: 'center' },

  pill:         { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: '#F3F5F9' },
  pillActive:   { backgroundColor: PRIMARY },
  pillText:     { fontSize: 12, color: N600 },
  pillTextActive: { color: '#fff' },

  countLabel:  { fontSize: 11, color: N400 },
  sectionLabel: { fontSize: 12, color: N500 },
  emptyText:   { fontSize: 12, color: N400, textAlign: 'center', paddingVertical: 24, lineHeight: 20 },

  listRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: N100 },
  thumbSm:       { width: 40, height: 40, borderRadius: 8, backgroundColor: N100, alignItems: 'center', justifyContent: 'center' },
  listRowName:   { fontSize: 13, color: N900 },
  listRowSub:    { fontSize: 11, color: N400 },

  backRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 12, color: PRIMARY },
  detailHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumbLg:      { width: 56, height: 56, borderRadius: 12, backgroundColor: N100, alignItems: 'center', justifyContent: 'center' },
  detailName:   { fontSize: 14, color: N900 },
  detailSub:    { fontSize: 11, color: N500 },
  actionBtn:    { width: 36, height: 36, borderRadius: 8, backgroundColor: N100, alignItems: 'center', justifyContent: 'center' },
  actionLabel:  { fontSize: 10, color: N500 },

  transformCol:   { flex: 1, backgroundColor: N100, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  transformTitle: { fontSize: 11, color: N500, marginBottom: 2 },
  transformRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3 },
  transformAxis:  { fontSize: 11, width: 12, fontWeight: '600' },
  transformVal:   { flex: 1, fontSize: 12, color: N900 },

  previewArea: { borderRadius: 16, backgroundColor: N100, borderWidth: 1, borderColor: N200, height: 140, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewTag:  { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 999, borderWidth: 1, borderColor: N200 },
  previewRotateBtn: { position: 'absolute', bottom: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: N200, alignItems: 'center', justifyContent: 'center' },

  matBtn:         { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: N200, alignItems: 'center' },
  matBtnActive:   { borderColor: PRIMARY, backgroundColor: PRIMARY_LIGHT },
  matBtnText:     { fontSize: 12, color: N600 },
  matBtnTextActive: { color: PRIMARY },

  addBtn:     { height: 48, borderRadius: 16, backgroundColor: PRIMARY, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  catalogThumb:    { aspectRatio: 1, borderRadius: 12, backgroundColor: N100, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  catalogName:     { fontSize: 11, color: N700, marginTop: 4 },
  catalogPrice:    { fontSize: 10, color: PRIMARY, fontWeight: '600', marginTop: 1 },
  myFurnitureBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: PRIMARY, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  myFurnitureBadgeText: { color: '#fff', fontSize: 8, fontWeight: '700' },
  previewEmoji:    { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },

  summaryCard:  { borderRadius: 16, backgroundColor: N100, borderWidth: 1, borderColor: N200, padding: 12 },
  summaryLabel: { fontSize: 11, color: N400 },
  summaryValue: { fontSize: 16, color: N900, fontWeight: '500' },
  summaryUnit:  { fontSize: 10, color: N400 },

  colorSwatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: N200 },
  fieldCard:   { borderRadius: 12, borderWidth: 1, borderColor: N100, overflow: 'hidden' },
  fieldRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10 },
  fieldLabel:  { fontSize: 13, color: N600 },
  fieldValue:  { fontSize: 14, color: N900 },
  fieldUnit:   { fontSize: 11, color: N400 },
});

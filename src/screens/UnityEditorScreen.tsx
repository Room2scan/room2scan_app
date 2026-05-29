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
  createAddFurniturePayload,
  createDeleteSelectedPayload,
  createDuplicateSelectedPayload,
  createMockRoomPayload,
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
import { ALL_FURNITURE } from '../data';
import { FurnitureItem } from '../types';

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
  { label: '전체',   type: null         },
  { label: '소파',   type: 'Sofa'       },
  { label: '침대',   type: 'Bed'        },
  { label: '의자',   type: 'Chair'      },
  { label: '테이블', type: 'Table'      },
  { label: '선반',   type: 'Shelf'      },
  { label: '드레서', type: 'Dresser'    },
  { label: '내 가구', type: 'myFurniture' },
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
export const UnityEditorScreen = ({ onBack }: { onBack: () => void }) => {
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

  // ── Editor-mode state (mirrored in Unity) ─────────────────────────────────
  const [viewMode,    setViewMode]    = useState<'2D' | '3D'>('3D');
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [selectedTool, setSelectedTool] = useState<EditorToolId>('select');

  // ── Per-object state (updated from Unity events) ──────────────────────────
  const [objectTransforms, setObjectTransforms] =
    useState<Record<string, TransformState>>({});
  const [objectVisibility, setObjectVisibility] =
    useState<Record<string, boolean>>({});   // true = visible (default)
  const [objectLocked, setObjectLocked] =
    useState<Record<string, boolean>>({});   // true = locked  (default false)
  const [objectCatalogIds, setObjectCatalogIds] =
    useState<Record<string, string>>({});    // instanceId → catalogId

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
          createMockUnityEvent(cmd.requestId, 'RoomLoaded', { roomId: 'replica_room0', success: true })
        ));
        break;

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

  const sendToUnity = (cmd: UnityBridgeEnvelope) => {
    const msg = serializeBridgeMessage(cmd);
    addLog('RN → Unity', cmd.name, msg);
    if (UnityView && unityRef.current) {
      unityRef.current.postMessage(UNITY_GAME_OBJECT, UNITY_RECEIVE_METHOD, msg);
    } else {
      simulateUnityResponse(cmd);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Action handlers
  // ─────────────────────────────────────────────────────────────────────────

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
    setSelectedTool('select');
  };

  const handleReset = () => {
    sendToUnity(createResetEditorPayload());
    setAddedInstanceIds([]);
    setSelectedInstanceId(null);
    setShowObjectDetail(false);
    setObjectTransforms({});
    setObjectVisibility({});
    setObjectLocked({});
    setObjectCatalogIds({});
    furnitureCounter = 0;
  };

  useEffect(() => { sendToUnity(createMockRoomPayload()); }, []);

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
  const minimapBottom = SH - SNAP[1] + 12;

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
        {UnityView ? (
          <UnityView
            ref={unityRef}
            style={StyleSheet.absoluteFill}
            fullScreen
            onUnityMessage={(e: UnityMessageEvent) => receiveFromUnity(e.nativeEvent.message)}
          />
        ) : (
          <ViewportPlaceholder />
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
            <TouchableOpacity style={s.vpChip}>
              <Feather name="eye" size={12} color={N700} />
              <Text style={s.vpChipText}>뷰 모드</Text>
            </TouchableOpacity>
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

        {/* Minimap */}
        <View style={[s.minimap, { bottom: minimapBottom }]} pointerEvents="none">
          <View style={s.minimapInner}>
            <View style={s.minimapBorder}>
              <View style={[s.minimapObj, { top: 4, left: 4, width: 10, height: 10 }]} />
              <View style={[s.minimapObj, { bottom: 4, right: 4, width: 14, height: 7 }]} />
              {selectedInstanceId && (
                <View style={[s.minimapSelected, { left: 16, top: 14, width: 16, height: 16 }]} />
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Header — solid white, z=30 */}
      <View style={[s.header, { height: HEADER_H, paddingTop: insets.top, zIndex: 30 }]}>
        <TouchableOpacity style={s.headerBackBtn} onPress={onBack} activeOpacity={0.75}>
          <Feather name="chevron-left" size={22} color={N900} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>룸 편집</Text>
          <View style={s.headerSubRow}>
            <Text style={s.headerSubText}>replica_room_0</Text>
            <Feather name="edit-2" size={10} color={N400} />
          </View>
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

// ─── Viewport placeholder (no Unity) ─────────────────────────────────────────
function ViewportPlaceholder() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg
        style={StyleSheet.absoluteFill}
        viewBox="0 0 393 812"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <Pattern
            id="isogrid" x="0" y="0" width="28" height="28"
            patternUnits="userSpaceOnUse"
            patternTransform="skewX(-30) scale(1,0.55)"
          >
            <Path d="M 28 0 L 0 0 0 28" fill="none" stroke="#C9D3E2" strokeWidth="1" />
          </Pattern>
        </Defs>
        <Rect width="393" height="812" fill="url(#isogrid)" opacity="0.4" />
        <Polygon points="96,440 196,480 296,440 196,400" fill="#E8C9A8" stroke="#A88560" strokeWidth="1.5" />
        <Polygon points="96,440 196,400 196,250 96,290"  fill="#EFEBE3" stroke="#9F9786" strokeWidth="1.5" />
        <Polygon points="296,440 196,400 196,250 296,290" fill="#E6E0D4" stroke="#9F9786" strokeWidth="1.5" />
        <Rect x="170" y="415" width="52" height="22" rx="3"
          fill="none" stroke={PRIMARY} strokeWidth="1.5" strokeDasharray="3,2" />
      </Svg>
      <View style={{ position: 'absolute', top: '37%', left: '26%' }}>
        <View style={ph.tag}><Text style={ph.text}>4.62m</Text></View>
      </View>
      <View style={{ position: 'absolute', top: '37%', right: '26%' }}>
        <View style={ph.tag}><Text style={ph.text}>3.85m</Text></View>
      </View>
      <View style={{ position: 'absolute', top: '47%', right: '10%' }}>
        <View style={ph.tag}><Text style={ph.text}>2.70m</Text></View>
      </View>
    </View>
  );
}
const ph = StyleSheet.create({
  tag:  { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(255,255,255,0.84)', borderRadius: 4 },
  text: { fontSize: 10, color: N500 },
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

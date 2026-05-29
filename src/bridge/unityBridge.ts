// ─────────────────────────────────────────────────────────────────────────────
// unityBridge.ts
// RN-side bridge contract for the Room Editor
// ─────────────────────────────────────────────────────────────────────────────

export const UNITY_BRIDGE_SCHEMA = 'unity-bridge/v1';
export const UNITY_GAME_OBJECT   = 'UnityBridge';
export const UNITY_RECEIVE_METHOD = 'ReceiveFromRN';

type BridgeKind      = 'command' | 'event';
type BridgeDirection = 'rn_to_unity' | 'unity_to_rn';

export type UnityBridgeEnvelope<TPayload = Record<string, unknown>> = {
  schemaVersion: typeof UNITY_BRIDGE_SCHEMA;
  messageId:  string;
  requestId?: string;
  kind:       BridgeKind;
  direction:  BridgeDirection;
  name:       string;
  sentAt:     string;
  payload:    TPayload;
};

// ─── Payload types (Unity → RN events) ────────────────────────────────────────

export type Vec3 = { x: number; y: number; z: number };

export type ObjectInfo = {
  instanceId:   string;
  catalogId:    string;
  position:     Vec3;
  rotationYDeg: number;
  scale:        number;
  visible:      boolean;
  locked:       boolean;
};

export type ObjectTransform = {
  position:     Vec3;
  rotationYDeg: number;
  scale:        number;
};

export type BridgeEventName =
  | 'RoomLoaded'
  | 'LayoutSaved'
  | 'FurnitureAdded'
  | 'FurnitureSelected'
  | 'FurnitureDuplicated'
  | 'FurnitureTransformed'
  | 'FurnitureDeleted'
  | 'ObjectListUpdated'
  | 'VisibilityChanged'
  | 'LockChanged'
  | 'ViewModeChanged'
  | 'SnapChanged'
  | 'ToolChanged'
  | 'UndoResult'
  | 'RedoResult'
  | 'EditorReset'
  | 'EditorError'
  | 'FurnitureCatalogLoaded';

// ─── Factory helpers ──────────────────────────────────────────────────────────

const makeId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export const createBridgeCommand = <TPayload extends Record<string, unknown>>(
  name: string,
  payload: TPayload,
  requestId = makeId(`req_${name.toLowerCase()}`)
): UnityBridgeEnvelope<TPayload> => ({
  schemaVersion: UNITY_BRIDGE_SCHEMA,
  messageId: makeId('rn_msg'),
  requestId,
  kind: 'command',
  direction: 'rn_to_unity',
  name,
  sentAt: new Date().toISOString(),
  payload,
});

// ─── RN → Unity commands ──────────────────────────────────────────────────────

/** LoadRoom — load the room mesh */
export const createMockRoomPayload = () =>
  createBridgeCommand('LoadRoom', {
    room: {
      schemaVersion: 'room-json/v1',
      roomId: 'replica_room0',
      source: {
        datasetName: 'replica',
        datasetVersion: 'v1',
        sceneId: 'room0',
        conversion: {
          tool: 'server-replica-glb-converter',
          toolVersion: '0.1.0',
          convertedAt: new Date().toISOString(),
          notes: 'P0 mock room payload.',
        },
      },
      coordinateSystem: {
        unit: 'meter',
        handedness: 'left',
        upAxis: '+Y',
        forwardAxis: '+Z',
        toUnity: {
          positionOffset: { x: 0, y: 0, z: 0 },
          rotationEulerDeg: { x: 0, y: 0, z: 0 },
          scaleMultiplier: 1,
        },
      },
      mesh: {
        uri: 'https://assets.room2scan.dev/replica/v1/room0/room0_mesh.glb',
        format: 'glb',
      },
      bounds: {
        min: { x: -0.8794, y: 0, z: -1.186 },
        max: { x:  6.8852, y: 2.8078, z: 3.5123 },
      },
      placement: {
        floorPolygons: [
          {
            id: 'floor_aabb_room0',
            elevationY: 0,
            points: [
              { x: -0.8794, z: -1.186  },
              { x:  6.8852, z: -1.186  },
              { x:  6.8852, z:  3.5123 },
              { x: -0.8794, z:  3.5123 },
            ],
          },
        ],
        blockedZones: [],
      },
      extensions: {},
    },
  });

/** SaveLayout — persist the current furniture layout */
export const createSaveLayoutPayload = () =>
  createBridgeCommand('SaveLayout', {});

/** AddFurniture — add a new catalog item to the scene */
export const createAddFurniturePayload = (
  instanceId: string,
  catalogId:  string,
  position:   Vec3 = { x: 0, y: 0, z: 0 }
) => createBridgeCommand('AddFurniture', { instanceId, catalogId, position });

/** SelectFurniture — select/highlight an existing item */
export const createSelectFurniturePayload = (instanceId: string) =>
  createBridgeCommand('SelectFurniture', { instanceId });

/** DuplicateSelected — clone the currently selected item */
export const createDuplicateSelectedPayload = () =>
  createBridgeCommand('DuplicateSelected', {});

/** RotateSelected — rotate selected item by deltaDeg around Y */
export const createRotateSelectedPayload = (deltaDeg: number) =>
  createBridgeCommand('RotateSelected', { deltaDeg });

/** DeleteSelected — remove the selected item */
export const createDeleteSelectedPayload = () =>
  createBridgeCommand('DeleteSelected', {});

/** SetActiveTool — inform Unity of the active editing tool */
export type EditorToolId = 'select' | 'move' | 'rotate' | 'scale' | 'duplicate' | 'delete';
export const createSetActiveToolPayload = (toolId: EditorToolId) =>
  createBridgeCommand('SetActiveTool', { toolId });

/** SetObjectVisibility — show or hide a specific object */
export const createSetVisibilityPayload = (instanceId: string, visible: boolean) =>
  createBridgeCommand('SetObjectVisibility', { instanceId, visible });

/** SetObjectLocked — lock or unlock a specific object */
export const createSetLockedPayload = (instanceId: string, locked: boolean) =>
  createBridgeCommand('SetObjectLocked', { instanceId, locked });

/** UndoAction — undo the last editor action */
export const createUndoPayload = () =>
  createBridgeCommand('UndoAction', {});

/** RedoAction — redo the last undone action */
export const createRedoPayload = () =>
  createBridgeCommand('RedoAction', {});

/** SetViewMode — switch between 2D top-down and 3D perspective camera */
export const createSetViewModePayload = (mode: '2D' | '3D') =>
  createBridgeCommand('SetViewMode', { mode });

/** SetSnapEnabled — toggle floor-grid snapping */
export const createSetSnapPayload = (enabled: boolean) =>
  createBridgeCommand('SetSnapEnabled', { enabled });

/** ResetEditor — clear all furniture and reset the room */
export const createResetEditorPayload = () =>
  createBridgeCommand('ResetEditor', {});

/** LoadFurnitureCatalog — request catalog data for a given id */
export const createLoadFurnitureCatalogPayload = (catalogId: string) =>
  createBridgeCommand('LoadFurnitureCatalog', { catalogId });

// ─── Mock Unity event builder (simulation / testing) ─────────────────────────

export const createMockUnityEvent = (
  requestId: string | undefined,
  name: BridgeEventName,
  payload: Record<string, unknown>
): UnityBridgeEnvelope => ({
  schemaVersion: UNITY_BRIDGE_SCHEMA,
  messageId: makeId('unity_msg'),
  requestId,
  kind: 'event',
  direction: 'unity_to_rn',
  name,
  sentAt: new Date().toISOString(),
  payload,
});

// ─── Serialisation ────────────────────────────────────────────────────────────

export const serializeBridgeMessage = (message: UnityBridgeEnvelope) =>
  JSON.stringify(message);

export const deserializeBridgeMessage = (json: string): UnityBridgeEnvelope | null => {
  try {
    return JSON.parse(json) as UnityBridgeEnvelope;
  } catch {
    return null;
  }
};

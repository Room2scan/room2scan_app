export const UNITY_BRIDGE_SCHEMA = 'unity-bridge/v1';
export const UNITY_GAME_OBJECT = 'UnityBridge';
export const UNITY_RECEIVE_METHOD = 'ReceiveFromRN';

type BridgeKind = 'command' | 'event';
type BridgeDirection = 'rn_to_unity' | 'unity_to_rn';

export type UnityBridgeEnvelope<TPayload = Record<string, unknown>> = {
  schemaVersion: typeof UNITY_BRIDGE_SCHEMA;
  messageId: string;
  requestId?: string;
  kind: BridgeKind;
  direction: BridgeDirection;
  name: string;
  sentAt: string;
  payload: TPayload;
};

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
          notes: 'P0 mock room payload. Server will provide this GLB URL in production.',
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
        max: { x: 6.8852, y: 2.8078, z: 3.5123 },
      },
      placement: {
        floorPolygons: [
          {
            id: 'floor_aabb_room0',
            elevationY: 0,
            points: [
              { x: -0.8794, z: -1.186 },
              { x: 6.8852, z: -1.186 },
              { x: 6.8852, z: 3.5123 },
              { x: -0.8794, z: 3.5123 },
            ],
          },
        ],
        blockedZones: [],
      },
      extensions: {},
    },
  });

export const createSaveLayoutPayload = () =>
  createBridgeCommand('SaveLayout', {});

export const createAddFurniturePayload = (
  instanceId: string,
  catalogId: string,
  position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
) =>
  createBridgeCommand('AddFurniture', { instanceId, catalogId, position });

export const createSelectFurniturePayload = (instanceId: string) =>
  createBridgeCommand('SelectFurniture', { instanceId });

export const createRotateSelectedPayload = (deltaDeg: number) =>
  createBridgeCommand('RotateSelected', { deltaDeg });

export const createDeleteSelectedPayload = () =>
  createBridgeCommand('DeleteSelected', {});

export const createResetEditorPayload = () =>
  createBridgeCommand('ResetEditor', {});

export const createLoadFurnitureCatalogPayload = (catalogId: string) =>
  createBridgeCommand('LoadFurnitureCatalog', { catalogId });

export const createMockUnityEvent = (
  requestId: string | undefined,
  name: 'RoomLoaded' | 'LayoutSaved',
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

export const serializeBridgeMessage = (message: UnityBridgeEnvelope) =>
  JSON.stringify(message);

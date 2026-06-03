export type AppState = 'home' | 'camera' | 'cameraFurniture' | 'processing' | 'editor' | 'roomDetail';
export type MainTab = 'home' | 'rooms' | 'catalog' | 'settings';
export type CatalogCategory = 'wishlist' | 'sofa' | 'bed' | 'table' | 'shelf' | 'chair' | 'myFurniture' | 'trend';
export type ViewMode = '3d' | '2d';

export interface FurnitureItem {
  id: string;
  name: string;
  type: string;
  dimensions: string;
  price: string;
  thumbnail: string;
  imageUrl?: any;      // optional product photo – string URL or require() result
  color: string;
  isWishlisted: boolean;
  rating: number;
  isMyFurniture?: boolean;
}

export interface RoomFurnitureItem {
  id: string;
  name: string;
  thumbnail: string;
  dimensions: string;
  x: number;
  y: number;
  rotation: number;
}

export interface RoomProject {
  id: string;
  name: string;
  area: string;
  furnitureCount: number;
  lastEdited: string;
  gradient: string;
  meshColor: string;
  isFeatured: boolean;
  furniture: RoomFurnitureItem[];
  heroImage: any;      // string URL or require() result
  realPhotos: any[];   // string URLs or require() results
  description: string;
  // ── 3D scene (ReplicaCAD) ──────────────────────────────────────────────────
  glbPath?: string;         // Local absolute path to room/stage GLB
  sceneJsonPath?: string;   // Local absolute path to scene_instance.json
  objectsBasePath?: string; // Local absolute path to objects/ directory
  deliveryManifestPath?: string; // Local absolute path to room delivery manifest
}

export interface SnackbarItem {
  id: string;
  message: string;
  icon?: string;
}

export interface HeroBanner {
  id: string;
  label: string;
  headline: string;
  subtext: string;
  imageUrl: string;
  ctaText: string;
  overlayFrom: string;
  overlayTo: string;
}

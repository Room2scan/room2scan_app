// ─── Types ────────────────────────────────────────────────────────────────────

export type AppState = 'home' | 'camera' | 'cameraFurniture' | 'processing' | 'editor' | 'roomDetail';
export type MainTab = 'home' | 'rooms' | 'catalog' | 'settings';
export type CatalogCategory = 'wishlist' | 'sofa' | 'bed' | 'table' | 'shelf' | 'chair' | 'myFurniture';
export type ViewMode = '3d' | '2d';
export interface FurnitureItem {
  id: string;
  name: string;
  type: string;
  dimensions: string;
  price: string;
  thumbnail: string;
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
  heroImage: string;
  realPhotos: string[];
  description: string;
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
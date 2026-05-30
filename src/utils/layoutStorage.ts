/**
 * layoutStorage.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * AsyncStorage wrapper for persisting room furniture layouts.
 *
 * Layout schema (layout-json/v1):
 *   {
 *     schemaVersion: 'layout-json/v1',
 *     layoutId: string,
 *     roomId: string,
 *     savedAt: ISO string,
 *     items: Array<{
 *       instanceId: string,
 *       catalogId:  string,
 *       position:   { x, y, z },
 *       rotationYDeg: number,
 *       scale: number,
 *     }>
 *   }
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface LayoutItem {
  instanceId:   string;
  catalogId:    string;
  position:     { x: number; y: number; z: number };
  rotationYDeg: number;
  scale:        number;
}

export interface SavedLayout {
  schemaVersion: 'layout-json/v1';
  layoutId:      string;
  roomId:        string;
  savedAt:       string;
  items:         LayoutItem[];
}

// ─── Storage key helpers ───────────────────────────────────────────────────

const KEY_PREFIX  = '@room2scan:layout:';
const INDEX_KEY   = '@room2scan:layout_index';

const layoutKey = (roomId: string) => `${KEY_PREFIX}${roomId}`;

// ─── Save ──────────────────────────────────────────────────────────────────

/**
 * Persist a layout for a given roomId.
 * Overwrites any previous layout for the same room.
 */
export async function saveLayout(roomId: string, items: LayoutItem[]): Promise<SavedLayout> {
  const layout: SavedLayout = {
    schemaVersion: 'layout-json/v1',
    layoutId:      `layout_${roomId}_${Date.now()}`,
    roomId,
    savedAt:       new Date().toISOString(),
    items,
  };

  try {
    await AsyncStorage.setItem(layoutKey(roomId), JSON.stringify(layout));

    // Maintain an index of all saved room IDs
    const raw   = await AsyncStorage.getItem(INDEX_KEY);
    const index: string[] = raw ? JSON.parse(raw) : [];
    if (!index.includes(roomId)) {
      await AsyncStorage.setItem(INDEX_KEY, JSON.stringify([...index, roomId]));
    }

    console.log(`[LayoutStorage] Saved ${items.length} items for room "${roomId}"`);
  } catch (e) {
    console.warn('[LayoutStorage] Save failed:', e);
  }

  return layout;
}

// ─── Load ──────────────────────────────────────────────────────────────────

/**
 * Load the persisted layout for a roomId.
 * Returns null if no layout has been saved yet.
 */
export async function loadLayout(roomId: string): Promise<SavedLayout | null> {
  try {
    const raw = await AsyncStorage.getItem(layoutKey(roomId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedLayout;
    if (parsed.schemaVersion !== 'layout-json/v1') return null;
    console.log(`[LayoutStorage] Loaded ${parsed.items.length} items for room "${roomId}"`);
    return parsed;
  } catch (e) {
    console.warn('[LayoutStorage] Load failed:', e);
    return null;
  }
}

// ─── Delete ────────────────────────────────────────────────────────────────

export async function deleteLayout(roomId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(layoutKey(roomId));
    const raw   = await AsyncStorage.getItem(INDEX_KEY);
    const index: string[] = raw ? JSON.parse(raw) : [];
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index.filter(id => id !== roomId)));
  } catch (e) {
    console.warn('[LayoutStorage] Delete failed:', e);
  }
}

// ─── List all saved rooms ──────────────────────────────────────────────────

export async function listSavedRooms(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Get furniture count for a room ───────────────────────────────────────

export async function getSavedFurnitureCount(roomId: string): Promise<number> {
  const layout = await loadLayout(roomId);
  return layout?.items.length ?? 0;
}

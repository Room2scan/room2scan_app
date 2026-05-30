/**
 * roomStorage.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * AsyncStorage wrapper for persisting user-created (procedural) rooms.
 *
 * Schema:
 *   {
 *     id:           string,     // 'custom_1234...'
 *     name:         string,
 *     createdAt:    ISO string,
 *     lastEdited:   ISO string,
 *     type:         string,     // preset type: 'bedroom' | 'living' | ...
 *     width:        number,     // metres
 *     length:       number,
 *     height:       number,
 *     furnitureCount: number,   // updated from layout storage
 *   }
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSavedFurnitureCount } from './layoutStorage';
import { ProceduralRoomOptions } from '../bridge/unityBridge';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CustomRoom {
  id:             string;
  name:           string;
  createdAt:      string;
  lastEdited:     string;
  type:           string;
  width:          number;
  length:         number;
  height:         number;
  furnitureCount: number;
}

// ─── Keys ─────────────────────────────────────────────────────────────────────

const ROOM_PREFIX = '@room2scan:customRoom:';
const INDEX_KEY   = '@room2scan:customRoom_index';
const SPEC_PREFIX = '@room2scan:roomSpec:';

const roomKey = (id: string) => `${ROOM_PREFIX}${id}`;
const specKey = (id: string) => `${SPEC_PREFIX}${id}`;

// ─── Save ──────────────────────────────────────────────────────────────────────

export async function saveCustomRoom(room: Omit<CustomRoom, 'furnitureCount'>): Promise<CustomRoom> {
  const count = await getSavedFurnitureCount(room.id);
  const full: CustomRoom = { ...room, furnitureCount: count };
  try {
    await AsyncStorage.setItem(roomKey(room.id), JSON.stringify(full));
    const raw   = await AsyncStorage.getItem(INDEX_KEY);
    const index: string[] = raw ? JSON.parse(raw) : [];
    if (!index.includes(room.id)) {
      await AsyncStorage.setItem(INDEX_KEY, JSON.stringify([room.id, ...index]));
    }
    console.log(`[RoomStorage] Saved room "${room.name}" (${room.id})`);
  } catch (e) {
    console.warn('[RoomStorage] Save failed:', e);
  }
  return full;
}

// ─── Update furniture count after layout changes ───────────────────────────

export async function refreshFurnitureCount(roomId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(roomKey(roomId));
    if (!raw) return;
    const room: CustomRoom = JSON.parse(raw);
    const count = await getSavedFurnitureCount(roomId);
    await AsyncStorage.setItem(
      roomKey(roomId),
      JSON.stringify({ ...room, furnitureCount: count, lastEdited: new Date().toISOString() })
    );
  } catch (e) {
    console.warn('[RoomStorage] Refresh failed:', e);
  }
}

// ─── Load ──────────────────────────────────────────────────────────────────────

export async function loadCustomRoom(id: string): Promise<CustomRoom | null> {
  try {
    const raw = await AsyncStorage.getItem(roomKey(id));
    if (!raw) return null;
    return JSON.parse(raw) as CustomRoom;
  } catch {
    return null;
  }
}

// ─── Load all ─────────────────────────────────────────────────────────────────

export async function loadAllCustomRooms(): Promise<CustomRoom[]> {
  try {
    const raw   = await AsyncStorage.getItem(INDEX_KEY);
    const index: string[] = raw ? JSON.parse(raw) : [];
    const rooms = await Promise.all(index.map(id => loadCustomRoom(id)));
    return rooms.filter((r): r is CustomRoom => r !== null);
  } catch {
    return [];
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteCustomRoom(id: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(roomKey(id));
    await AsyncStorage.removeItem(specKey(id));   // also remove spec
    const raw   = await AsyncStorage.getItem(INDEX_KEY);
    const index: string[] = raw ? JSON.parse(raw) : [];
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index.filter(i => i !== id)));
  } catch (e) {
    console.warn('[RoomStorage] Delete failed:', e);
  }
}

// ─── Room spec (ProceduralRoomOptions) ────────────────────────────────────────
// Stored separately so UnityEditorScreen can re-send CreateProceduralRoom
// when the user re-enters a custom room without navigating through RoomSetupScreen.

export async function saveRoomSpec(id: string, spec: ProceduralRoomOptions): Promise<void> {
  try {
    await AsyncStorage.setItem(specKey(id), JSON.stringify(spec));
    console.log(`[RoomStorage] Saved spec for room "${id}"`);
  } catch (e) {
    console.warn('[RoomStorage] saveRoomSpec failed:', e);
  }
}

export async function loadRoomSpec(id: string): Promise<ProceduralRoomOptions | null> {
  try {
    const raw = await AsyncStorage.getItem(specKey(id));
    if (!raw) return null;
    return JSON.parse(raw) as ProceduralRoomOptions;
  } catch {
    return null;
  }
}

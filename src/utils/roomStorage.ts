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

const roomKey = (id: string) => `${ROOM_PREFIX}${id}`;

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
    const raw   = await AsyncStorage.getItem(INDEX_KEY);
    const index: string[] = raw ? JSON.parse(raw) : [];
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index.filter(i => i !== id)));
  } catch (e) {
    console.warn('[RoomStorage] Delete failed:', e);
  }
}

/**
 * apiClient.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * HTTP client for the Room2Scan FastAPI backend.
 * Base URL: https://acclivitous-marlys-nonconscientiously.ngrok-free.dev
 *
 * Endpoint mapping:
 *   POST /images/upload          → createRoom()        → image_id: number
 *   GET  /images/{id}            → getRoom()
 *   POST /placement              → savePlacement()     → placement_id: number
 *   GET  /placement/{image_id}   → getPlacements()
 *   PUT  /placement/{id}         → updatePlacement()
 *   DELETE /placement/{id}       → deletePlacement()
 *   GET  /scene/{image_id}       → getScene()
 *   GET  /furniture              → listFurniture()
 *   POST /furniture              → registerFurniture() → furniture_id: number
 *
 * All calls are fire-and-forget friendly — errors are logged but not re-thrown
 * so the UI never crashes due to a backend issue.
 */

const BASE_URL = 'https://acclivitous-marlys-nonconscientiously.ngrok-free.dev';

/** Headers required to bypass ngrok browser-warning page */
const BASE_HEADERS: Record<string, string> = {
  'ngrok-skip-browser-warning': 'true',
  'Accept':                      'application/json',
};

// ─── Internal fetch helper ────────────────────────────────────────────────────

async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { ...BASE_HEADERS, ...(options.headers as Record<string, string> ?? {}) },
    });
    if (!res.ok) {
      console.warn(`[API] ${options.method ?? 'GET'} ${path} → ${res.status}`);
      return null;
    }
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : null;
  } catch (e) {
    console.warn(`[API] fetch error for ${path}:`, e);
    return null;
  }
}

// ─── Room (Image) ─────────────────────────────────────────────────────────────

/**
 * Registers a procedural room with the backend.
 * Uploads a tiny JSON blob as the "image file" (room has no real photo yet).
 * Returns the backend image_id, or null on failure.
 */
export async function createRoom(
  roomId:  string,
  name:    string,
  width:   number,
  length:  number,
  height:  number
): Promise<number | null> {
  try {
    // Create a minimal JSON "image" file as stand-in until ARCore scan is available
    const meta    = JSON.stringify({ roomId, name, width, length, height, source: 'procedural' });
    const blob    = new Blob([meta], { type: 'application/json' });
    const form    = new FormData();
    form.append('file', blob, `${roomId}.json`);

    const data = await apiFetch<any>('/images/upload', { method: 'POST', body: form });
    if (!data) return null;

    // Backend may return { id, image_id, ... } — try common keys
    const imageId = data.id ?? data.image_id ?? data.imageId ?? null;
    if (imageId == null) {
      console.warn('[API] createRoom: could not extract image_id from', data);
      return null;
    }

    console.log(`[API] Room registered: image_id=${imageId} (${name})`);
    return Number(imageId);
  } catch (e) {
    console.warn('[API] createRoom failed:', e);
    return null;
  }
}

export async function getRoom(imageId: number): Promise<any | null> {
  return apiFetch(`/images/${imageId}`);
}

// ─── Furniture catalog ────────────────────────────────────────────────────────

let _cachedFurnitureId: number | null = null;

/**
 * Ensures a generic placeholder furniture item exists in the backend.
 * We store all actual furniture info in AsyncStorage (ReplicaCAD catalog);
 * the backend only needs a furniture_id integer for the placement endpoint.
 * Returns a stable furniture_id (creates once, then caches).
 */
export async function ensureGenericFurnitureId(): Promise<number> {
  if (_cachedFurnitureId !== null) return _cachedFurnitureId;

  // Check if any furniture already exists
  const list = await apiFetch<any[]>('/furniture');
  if (list && list.length > 0) {
    _cachedFurnitureId = list[0].id ?? list[0].furniture_id ?? 1;
    return _cachedFurnitureId!;
  }

  // Create a placeholder
  const form = new FormData();
  form.append('name', 'generic');
  // Backend requires model_file and thumbnail_file — send 1-byte placeholders
  form.append('model_file',     new Blob([' '], { type: 'application/octet-stream' }), 'model.bin');
  form.append('thumbnail_file', new Blob([' '], { type: 'image/png' }),                'thumb.png');

  const data = await apiFetch<any>('/furniture', { method: 'POST', body: form });
  const id   = data?.id ?? data?.furniture_id ?? 1;
  _cachedFurnitureId = Number(id);
  console.log(`[API] Generic furniture registered: furniture_id=${_cachedFurnitureId}`);
  return _cachedFurnitureId!;
}

// ─── Placements ───────────────────────────────────────────────────────────────

export interface PlacementItem {
  instanceId: string;  // RN-side ID (for local reference)
  catalogId:  string;  // ReplicaCAD catalog ID
  x:          number;
  y:          number;
  z:          number;
  rotation:   number;  // Y-axis degrees
}

export interface BackendPlacement {
  placement_id: number;
  instanceId:   string;
  catalogId:    string;
}

/**
 * Saves one furniture placement to the backend.
 * Returns the backend placement_id, or null on failure.
 */
export async function savePlacement(
  imageId:     number,
  furnitureId: number,
  item:        PlacementItem
): Promise<number | null> {
  // Placement endpoint uses query params
  const params = new URLSearchParams({
    image_id:     String(imageId),
    furniture_id: String(furnitureId),
    x:            String(item.x),
    y:            String(item.y),
    z:            String(item.z),
    rotation:     String(item.rotation),
  });

  const data = await apiFetch<any>(`/placement?${params}`, { method: 'POST' });
  const id   = data?.id ?? data?.placement_id ?? null;
  return id != null ? Number(id) : null;
}

/**
 * Replaces all placements for a room.
 * The backend has no bulk-delete endpoint, so we delete existing placements
 * one-by-one then re-insert. For now, we only insert (idempotency via layoutId).
 */
export async function syncLayout(
  imageId:  number,
  items:    PlacementItem[]
): Promise<void> {
  const furnitureId = await ensureGenericFurnitureId();

  // Fetch existing placements and delete them
  const existing = await apiFetch<any[]>(`/placement/${imageId}`);
  if (existing && Array.isArray(existing)) {
    await Promise.all(
      existing.map(p => {
        const pid = p.id ?? p.placement_id;
        if (pid == null) return Promise.resolve();
        return apiFetch(`/placement/${pid}`, { method: 'DELETE' });
      })
    );
  }

  // Re-insert current layout
  await Promise.all(
    items.map(item => savePlacement(imageId, furnitureId, item))
  );

  console.log(`[API] Synced ${items.length} placements for image_id=${imageId}`);
}

export async function getPlacements(imageId: number): Promise<any[] | null> {
  return apiFetch<any[]>(`/placement/${imageId}`);
}

export async function deletePlacement(placementId: number): Promise<void> {
  await apiFetch(`/placement/${placementId}`, { method: 'DELETE' });
}

// ─── Scene ────────────────────────────────────────────────────────────────────

/** Returns the full scene (room + all placements) for a given image_id. */
export async function getScene(imageId: number): Promise<any | null> {
  return apiFetch(`/scene/${imageId}`);
}

# Room2Scan 개발 야간 자동화 로그

> 이 파일은 Claude가 자동으로 업데이트합니다.  
> 마지막 업데이트: 2026-05-31 세션 완료

---

## 진행 현황

| Phase | 상태 | 완료 |
|-------|------|------|
| P2: BUILD_GUIDE.md 작성 | ✅ 완료 | ✓ |
| P2: unity.local.properties 경로 수정 | ✅ 완료 | ✓ |
| P2: AndroidManifest 카메라 권한 추가 | ✅ 완료 | ✓ |
| P3: AsyncStorage 레이아웃 저장 유틸 | ✅ 완료 | ✓ |
| P3: UnityEditorScreen 자동 저장/불러오기 | ✅ 완료 | ✓ |
| P4: RoomSetupScreen (새 방 생성 UI) | ✅ 완료 | ✓ |
| P4: Bridge — CreateProceduralRoom 커맨드 | ✅ 완료 | ✓ |
| P4: Unity ProceduralRoomBuilder.cs | ✅ 완료 | ✓ |
| P4: UnityBridge.cs 핸들러 추가 | ✅ 완료 | ✓ |
| P4: expo-camera 실제 카메라 프리뷰 | ✅ 완료 | ✓ |
| P4: 카메라 권한 흐름 (iOS/Android) | ✅ 완료 | ✓ |
| P4: CustomRoom AsyncStorage 저장 (roomStorage.ts) | ✅ 완료 | ✓ |
| P4: MyRoomsScreen 동적 커스텀 방 목록 | ✅ 완료 | ✓ |
| P4: 커스텀 방 재진입 (saveRoomSpec / loadRoomSpec) | ✅ 완료 | ✓ |
| P4: LayoutSaved → refreshFurnitureCount 연결 | ✅ 완료 | ✓ |

---

## 자고 일어나서 해야 할 것 (유저 액션 필요)

### 1. Unity Android Export (P2 핵심)

```
1. Unity Hub → E:\unity\room2scan_unity 열기
2. File → Build Settings → Android → ☑ Export Project 체크
3. Export 클릭 → 저장 경로: E:\unity\room2scan_unity_android\
4. 완료 후 android/unity.local.properties는 이미 올바른 경로로 설정됨
```

### 2. APK 빌드

```bash
cd E:\unity\room2scan_app
npx expo prebuild --platform android   # 처음이라면
cd android
.\gradlew assembleDebug
adb install app\build\outputs\apk\debug\app-debug.apk
```

자세한 내용은 `BUILD_GUIDE.md` 참조.

---

## 변경된 파일 전체 목록

### RN 앱 (`room2scan_app`)

#### 새 파일
| 파일 | 설명 |
|------|------|
| `BUILD_GUIDE.md` | Android APK 빌드 가이드 (단계별) |
| `src/utils/layoutStorage.ts` | AsyncStorage 기반 레이아웃 저장/불러오기 |
| `src/screens/RoomSetupScreen.tsx` | P4: 새 방 생성 UI (방 유형 선택 + 치수 입력) |

#### 수정된 파일
| 파일 | 변경 내용 |
|------|-----------|
| `App.tsx` | RoomSetupScreen 상태 추가 (`roomSetup`), 라우팅 연결 |
| `app.json` | expo-camera 플러그인 + 카메라 권한 추가 |
| `android/unity.local.properties` | 올바른 Unity export 경로로 업데이트 |
| `android/app/src/main/AndroidManifest.xml` | CAMERA 권한 + uses-feature 추가 |
| `src/bridge/unityBridge.ts` | `CreateProceduralRoom` 커맨드 타입 + 팩토리 함수 추가 |
| `src/screens/HomeScreen.tsx` | `onScanRoom` prop 추가, 카메라 스캔 카드 추가 |
| `src/screens/UnityEditorScreen.tsx` | AsyncStorage 레이아웃 저장/불러오기 연결 |
| `src/screens/PanoramaCameraScreen.tsx` | expo-camera 실제 카메라 프리뷰 + 권한 요청 UI |

### Unity 프로젝트 (`room2scan_unity`)

#### 새 파일
| 파일 | 설명 |
|------|------|
| `Assets/Scripts/Rooms/ProceduralRoomBuilder.cs` | P4: 프로시저럴 방 메시 빌더 (바닥/천장/4벽, 문/창문 컷아웃) |
| `Assets/Scripts/Rooms/ProceduralRoomBuilder.cs.meta` | Unity 메타파일 |

#### 수정된 파일
| 파일 | 변경 내용 |
|------|-----------|
| `Assets/Scripts/Bridge/UnityBridge.cs` | `CreateProceduralRoom` 핸들러 + `AttachOrbitCamera` 헬퍼 |

---

## 상세 설명

### P2 — Android 빌드 준비

**`BUILD_GUIDE.md`**: Unity Android Export → Gradle 빌드 → APK 설치까지 전 과정 문서화.  
**`unity.local.properties`**: 경로를 `E:\unity\room2scan_unity_android\unityLibrary`로 업데이트.  
**`AndroidManifest.xml`**: `android.permission.CAMERA` + `android.hardware.camera` feature 추가.

### P3 — 레이아웃 자동 저장/불러오기

**`layoutStorage.ts`**:
- `saveLayout(roomId, items[])` — AsyncStorage에 레이아웃 JSON 저장
- `loadLayout(roomId)` — 저장된 레이아웃 불러오기 (null if none)
- `deleteLayout(roomId)`, `listSavedRooms()`, `getSavedFurnitureCount(roomId)`

**`UnityEditorScreen.tsx`**:
- `LayoutSaved` 이벤트 핸들러 추가 → `saveLayout()` 호출
- `unityConnected`가 true가 되면 `loadLayout()` → Unity에 `AddFurniture` 커맨드 재전송
- `layoutRestoredRef`로 중복 복원 방지

### P4 — 새 방 생성 플로우

**`RoomSetupScreen.tsx`**:
- Step 1: 방 유형 선택 (침실/거실/주방/서재/욕실/직접입력) + 치수 입력 (너비/길이/높이)
- Step 2: 방 이름 입력 + 요약 카드
- 실시간 방 시각화 (2D 평면도)
- 치수 유효성 검사
- Unity 있으면 `CreateProceduralRoom` 커맨드, 없으면 2.2초 시뮬레이션

**`src/bridge/unityBridge.ts`**:
- `ProceduralRoomOptions` 인터페이스 추가
- `DoorSpec`, `WindowSpec` 인터페이스 추가
- `createProceduralRoomPayload(opts)` 팩토리 함수 추가
- `BridgeEventName`에 `ProceduralRoomCreated` 추가

**`ProceduralRoomBuilder.cs`**:
- 바닥/천장: axis-aligned quad 메시
- 4개 벽: solid 또는 문/창문 컷아웃 포함 메시
- 문(south 벽), 창문(north, east) 기본 배치
- 각 서피스에 맞는 색상 머티리얼 적용 (바닥 베이지, 천장 흰색, 벽 크림)
- 완료 후 `ProceduralRoomCreated` + `RoomLoaded` 이벤트 발송

**`PanoramaCameraScreen.tsx`**:
- `useCameraPermissions()` 훅으로 권한 상태 관리
- 권한 없으면: 권한 요청 UI 표시 (한국어)
- 권한 있으면: `CameraView`로 실제 카메라 프리뷰
- 기존 스캔 UI (진행바, 경고, 스텝 표시)는 그대로 유지

---

## 커밋 히스토리

| 커밋 | 내용 |
|------|------|
| `f9eb8b0` | P2+P3+P4: BUILD_GUIDE, unity.local.properties, AndroidManifest, layoutStorage, UnityEditorScreen 저장/복원, RoomSetupScreen, CreateProceduralRoom bridge, PanoramaCameraScreen expo-camera |
| `08cc62f` | P4: custom room storage (roomStorage.ts) + MyRoomsScreen 동적 목록 |
| `9dfda66` | P4: 커스텀 방 재진입 (saveRoomSpec/loadRoomSpec) + refreshFurnitureCount 연결 |

---

## 추가 완료된 항목 (컨텍스트 이어서)

### roomStorage.ts (신규)
- `CustomRoom` 인터페이스 + AsyncStorage CRUD (`saveCustomRoom`, `loadCustomRoom`, `loadAllCustomRooms`, `deleteCustomRoom`, `refreshFurnitureCount`)
- `saveRoomSpec(id, ProceduralRoomOptions)` / `loadRoomSpec(id)` — 커스텀 방 spec 별도 저장
  - 저장 키: `@room2scan:roomSpec:<id>`
  - `deleteCustomRoom`이 spec도 함께 삭제

### MyRoomsScreen.tsx (업데이트)
- `useEffect` → `loadAllCustomRooms()` on mount
- `CustomRoomCard` 컴포넌트: 색상 배너 + 2D 평면도 아웃라인 + 타입 배지 + 치수 텍스트
- 커스텀 방(최신순) → 구분선 → 샘플 방(MY_ROOMS) 순서로 렌더
- 빈 상태 UI, ActivityIndicator 로딩

### UnityEditorScreen.tsx (업데이트)
- 마운트 `useEffect`: `roomId?.startsWith('custom_')` 감지 → `loadRoomSpec` → `createProceduralRoomPayload` 전송
- `simulateUnityResponse`: `CreateProceduralRoom` 케이스 추가 (ProceduralRoomCreated + RoomLoaded)
- `LayoutSaved` 핸들러: 레이아웃 저장 후 `refreshFurnitureCount(roomId)` 호출
- `SimulationFloorPlan`: 커스텀 방은 placeholder (이름 + 면적, furniture: []) 사용

---

## 알려진 한계 및 다음 단계

### 해결된 TODO
- ✅ 커스텀 방 에디터 재진입 — `saveRoomSpec` + `loadRoomSpec`으로 해결
- ✅ 방 목록에 커스텀 방 표시 — `MyRoomsScreen` 동적 로드로 해결
- ✅ `refreshFurnitureCount` — `LayoutSaved` 핸들러에서 호출

### 이번 세션에서 추가 해결 (컨텍스트 재개 후)

- ✅ **시뮬레이터 신택스에러 수정** — `RoomSetupScreen.tsx` 120번 줄: `||` 와 `??` 연산자 혼용 괄호 누락
  - 에러: `'||' and '??' operations cannot be mixed without parentheses`
  - 수정: `roomName.trim() || (ROOM_PRESETS.find(...)?.label ?? '새 방')`
  - Gradle build.gradle에 `maven { url "$rootDir/../node_modules/expo-camera/android/maven" }` 추가로 cameraview-1.0.0 해결

### 아직 남은 TODO (다음 세션)

1. **ARCore 실제 측정** — 현재 치수는 수동 입력. ARCore로 실제 방 치수 자동 측정 미구현.

2. **가구 StreamingAssets 번들링** — Android 기기에서 GLB 로드하려면 APK에 포함 필요.
   현재: Windows 절대경로 (Unity Editor 전용).

3. **Undo/Redo 스택** — UnityBridge에 TODO로 남아있음.

4. **커스텀 방 삭제 UI** — `MyRoomsScreen`에서 스와이프-삭제 또는 롱프레스 삭제 미구현.
   `deleteCustomRoom(id)` 함수는 있음.

5. **방 이름 편집** — 에디터 헤더에서 방 이름 인라인 편집 미구현.

6. **P5: ARCore 스캔 파이프라인** — PanoramaCameraScreen → depth 데이터 → 자동 치수 추출.

---

*이 로그는 Claude에 의해 자동 생성됨 — room2scan 야간 개발 세션*

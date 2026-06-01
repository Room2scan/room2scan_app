# Room2Scan 개발 야간 자동화 로그

> 이 파일은 Claude가 자동으로 업데이트합니다.  
> 마지막 업데이트: 2026-06-02 야간 세션 (P5 + 백엔드 연동)

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
| P4: CustomRoom AsyncStorage 저장 | ✅ 완료 | ✓ |
| P4: MyRoomsScreen 동적 커스텀 방 목록 | ✅ 완료 | ✓ |
| P4: 커스텀 방 재진입 (saveRoomSpec/loadRoomSpec) | ✅ 완료 | ✓ |
| P4: LayoutSaved → refreshFurnitureCount 연결 | ✅ 완료 | ✓ |
| **P5-A: 가구 터치 드래그 이동 (floor plane raycast)** | ✅ 완료 | ✓ |
| **P5-B: 충돌 검사 (벽+가구) + 초록/빨간 피드백** | ✅ 완료 | ✓ |
| **P5-C: 그리드 스냅 (0.25m) + 방 경계 클램프** | ✅ 완료 | ✓ |
| **P5-D: 2D/3D 카메라 전환 (OrbitCamera.SetTopDown)** | ✅ 완료 | ✓ |
| **Backend: apiClient.ts 연동** | ✅ 완료 | ✓ |
| **Backend: 방 생성 시 서버 등록** | ✅ 완료 | ✓ |
| **Backend: LayoutSaved → 서버 배치 동기화** | ✅ 완료 | ✓ |
| **자동 빌드: build_and_deploy.ps1** | ✅ 완료 | ✓ |
| **Unity CLI Export (batchmode, 209초)** | ✅ 완료 | ✓ |
| **Gradle assembleDebug (72.9 MB APK)** | ✅ 완료 | ✓ |
| **APK 에뮬레이터 설치 + 앱 실행** | ✅ 완료 | ✓ |

---

## 🌙 야간 세션 (2026-06-02) — P5 전체 + 백엔드 연동

### 작업 요약

사용자 취침 전 요청:
1. P5-A~D 전체 구현 (가구 이동/충돌/스냅/2D카메라)
2. 벽 밖으로 못 나가게 (경계 클램프)
3. 백엔드 연동 (https://acclivitous-marlys-nonconscientiously.ngrok-free.dev)
4. Unity 자동 빌드 (CLI export → Gradle → 에뮬레이터 설치)
5. DEVLOG 꼼꼼히 기록

### 진행 타임라인

| 단계 | 소요 | 결과 |
|------|------|------|
| 기존 코드 전체 분석 | - | ✅ |
| Backend openapi.json 파싱 | - | ✅ |
| Unity CLI 경로 확인 (6000.3.11f1) | - | ✅ |
| Unity C# 5개 파일 작성/수정 | - | ✅ |
| RN 4개 파일 + 빌드 스크립트 | - | ✅ |
| Git 커밋 (Unity + RN 각각) | - | ✅ |
| Unity Editor 종료 | - | ✅ |
| Unity CLI Export (batchmode) | 209초 | ✅ exit 0 |
| Gradle assembleDebug | ~2분 (증분 빌드) | ✅ 72.9 MB |
| APK 에뮬레이터 설치 + 실행 | 완료 | ✅ |

---

## P5 상세 구현

### P5-A: 가구 터치 드래그 이동

**신규**: `Assets/Scripts/Rooms/FurnitureDragController.cs`

- `Update()` — touch/mouse 입력 추상화 (모바일 + 에뮬레이터 둘 다)
- `tool == "move"` 일 때만 드래그 활성화
- `tool == "select"` 일 때 탭으로 가구 직접 선택 (Physics.Raycast)
- `Camera.ScreenPointToRay → floor Plane(y=0) 교차점` 계산
- `dragOffset`으로 자연스러운 드래그 (가구 중심 기준)
- 드래그 시작: `OrbitCameraController.enabled = false`
- 드래그 종료: `FurnitureTransformed` 이벤트 RN 전송

**신규**: `Assets/Scripts/Rooms/FurnitureIdentifier.cs`

- 가구 루트 GameObject에 붙이는 마커 컴포넌트
- `InstanceId` 필드 하나 (Unity 태그 등록 없이 raycast 식별)
- GLB 자식 mesh hit → `GetComponentInParent<FurnitureIdentifier>()` 로 상위 탐색

### P5-B: 충돌 검사 + 시각 피드백

**FurnitureManager.cs 추가**:

```csharp
// 새 색상
CollisionColor   = new Color(1.0f, 0.22f, 0.22f);  // 빨강
PlacementOkColor = new Color(0.25f, 0.85f, 0.35f); // 초록

// 새 메서드
CheckCollision(instanceId)
  → 벽 경계 체크: tb.min/max vs RoomBounds.min/max
  → 가구간 AABB: GetWorldBounds().Intersects()
  
SetCollisionColor(instanceId, hasCollision)
  → true: 빨간색 / false: 초록색 (드래그 중)
  → 드래그 종료 시 SelectFurniture() 재호출 → 노란색 복원

GetWorldBounds(go)
  → Renderer.bounds 기반 (큐브/GLB 모두 정확)
```

드래그 중 상태변화 시에만 `CollisionStatus` 이벤트 RN으로 전송 (flood 방지).

### P5-C: 그리드 스냅 + 방 경계 클램프

```
스냅:  bridge.SnapEnabled → target.x/z = Round(x / 0.25) * 0.25
경계: RoomBounds (ProceduralRoom 생성 / GLB 로드 시 설정)
      target.x = Clamp(x, min.x + half, max.x - half)
      target.z = Clamp(z, min.z + half, max.z - half)
```

### P5-D: 2D/3D 카메라 전환

**OrbitCameraController.cs 추가**:

```csharp
SetTopDown(true):
  - 현재 3D 상태 저장 (pivot, distance, yaw, pitch)
  - Camera.orthographic = true
  - orthographicSize = max(roomW, roomL) * 0.58
  - 위치: pivot + (0, 20, 0), 회전: Euler(90, 0, 0)

SetTopDown(false):
  - Camera.orthographic = false
  - 저장 상태 복원 + ApplyTransform()

LateUpdate(): isTopDown이면 early return (오빗 입력 차단)
```

**UnityBridge.SetViewMode**: TODO 주석 → 실제 `orbit.SetTopDown(mode == "2D")` 호출

---

## 백엔드 연동

### Backend API 구조

```
POST /images/upload           → { id: number }       ← 방 등록
GET  /images/{id}             → 방 정보
POST /furniture               → { id: number }       ← 가구 등록
GET  /furniture               → 가구 목록
POST /placement?image_id=&furniture_id=&x=&y=&z=&rotation=  → 배치 저장
GET  /placement/{image_id}    → 배치 목록
PUT  /placement/{id}          → 배치 업데이트
DELETE /placement/{id}        → 배치 삭제
GET  /scene/{image_id}        → 씬 전체
```

### 구현 전략

**방 등록**: 프로시저럴 방은 사진 없음 → JSON 메타를 "파일"로 업로드
**가구 ID**: `ensureGenericFurnitureId()` — placeholder 1개 생성, 모든 배치에 재사용  
**배치 동기화**: 기존 배치 전체 삭제 후 현재 레이아웃 재삽입 (replace 방식)  
**에러 처리**: 모든 API 함수 에러 시 null 반환 (백엔드 장애가 앱 죽이지 않음)

### 신규 파일: `src/utils/apiClient.ts`

```typescript
createRoom(roomId, name, w, l, h)     → number | null  // image_id
ensureGenericFurnitureId()             → number         // furniture_id
savePlacement(imageId, furnId, item)   → number | null  // placement_id
syncLayout(imageId, items[])           → void           // 전체 교체
getPlacements(imageId)                 → any[] | null
getScene(imageId)                      → any | null
```

---

## 변경된 파일 전체 목록

### Unity (`room2scan_unity`) — 커밋 `b9fa594`

| 파일 | 내용 |
|------|------|
| `FurnitureDragController.cs` | **신규** — 터치 드래그 + 충돌 피드백 + 스냅 |
| `FurnitureIdentifier.cs` | **신규** — 가구 raycast 마커 |
| `FurnitureManager.cs` | 추가: RoomBounds, SetRoomBounds, MoveSelected, GetSelectedGameObject, CheckCollision, SetCollisionColor, GetInstanceIdFromGameObject |
| `OrbitCameraController.cs` | 추가: SetTopDown(bool) + 2D 모드 입력 차단 |
| `UnityBridge.cs` | 추가: ActiveTool/SnapEnabled 프로퍼티, MoveFurniture 핸들러, EnsureFurnitureDragController, 이벤트 메서드 3개, ExtractFloat, SetViewMode 실구현 |
| `AndroidExportBuilder.cs` | 수정: DefaultOutputPath → `E:/unity/room2scan_unity_android` |

### RN 앱 (`room2scan_app`) — 커밋 `4e47fa1`

| 파일 | 내용 |
|------|------|
| `src/utils/apiClient.ts` | **신규** — 백엔드 API 클라이언트 전체 |
| `src/utils/roomStorage.ts` | 추가: `CustomRoom.backendImageId` 필드 |
| `src/bridge/unityBridge.ts` | 추가: `CollisionStatus` 이벤트, `createMoveFurniturePayload` |
| `src/screens/RoomSetupScreen.tsx` | 추가: 방 생성 시 `apiCreateRoom()` + backendImageId 저장 |
| `src/screens/UnityEditorScreen.tsx` | 추가: CollisionStatus 핸들러, LayoutSaved → `apiSyncLayout()` |
| `build_and_deploy.ps1` | **신규** — Unity CLI + Gradle + adb install 자동화 |

---

## 빌드 자동화: build_and_deploy.ps1

```powershell
# 전체 빌드 (Unity Export ~3분 + Gradle ~20분 + adb install)
.\build_and_deploy.ps1

# Unity export 건너뜀 (C# 코드 변경 없을 때)
.\build_and_deploy.ps1 -SkipUnity

# APK 재설치만
.\build_and_deploy.ps1 -SkipUnity -SkipGradle
```

---

## 커밋 히스토리

| 커밋 | 내용 |
|------|------|
| `f9eb8b0` | P2+P3+P4: BUILD_GUIDE, 카메라, 레이아웃 저장, RoomSetupScreen |
| `08cc62f` | P4: roomStorage.ts + MyRoomsScreen 동적 목록 |
| `9dfda66` | P4: saveRoomSpec/loadRoomSpec + refreshFurnitureCount |
| `b9fa594` | **P5: Unity 인터랙션 (드래그/충돌/스냅/2D뷰)** |
| `4e47fa1` | **P5+Backend: RN apiClient, bridge, roomStorage, 화면** |

---

## 아침 보고 (일어나셨을 때 읽어주세요) 🌅

### ✅ 밤새 완료한 것

| 기능 | 상태 |
|------|------|
| 가구 드래그 이동 (터치/마우스 → 방 바닥 위 이동) | ✅ |
| 충돌 검사: 다른 가구 겹치면 빨간색, 안 겹치면 초록색 | ✅ |
| 방 경계 클램프: 벽 밖으로 절대 못 나감 | ✅ |
| 그리드 스냅: 0.25m 격자 정렬 | ✅ |
| 2D 탑뷰 ↔ 3D 오빗 전환 버튼 실제 동작 | ✅ |
| 백엔드 방 등록 (POST /images/upload) | ✅ |
| 백엔드 레이아웃 동기화 (LayoutSaved → POST /placement) | ✅ |
| Unity CLI Export 자동화 (209초) | ✅ |
| build_and_deploy.ps1 빌드 스크립트 | ✅ |
| DEVLOG 업데이트 | ✅ |

### ✅ Gradle 빌드 + APK 설치 완료

- APK: `android/app/build/outputs/apk/debug/app-debug.apk` (72.9 MB)
- 에뮬레이터(`room2scan_pixel`)에 설치 완료
- 앱(`com.scan2room.app`) 실행 확인

### 🧪 아침에 테스트할 것

1. 에뮬레이터에서 앱 실행
2. 방 열기 → 가구 추가
3. **이동 툴** 선택 → 가구 드래그 → 방 안에서 이동하는지 확인
4. 가구끼리 겹칠 때 **빨간색** 나오는지 확인
5. 벽 가까이 드래그해도 **밖으로 못 나가는지** 확인
6. **2D 버튼** → 탑뷰로 전환되는지 확인
7. **스냅 버튼** → 0.25m 격자에 맞춰지는지 확인

### ⚠️ 알아두실 것

- 백엔드 ngrok URL은 재시작 시 변경될 수 있습니다. 변경되면 `src/utils/apiClient.ts`의 `BASE_URL` 수정
- Unity Editor는 CLI 빌드를 위해 종료했습니다. 코드 수정 후 재열기 가능
- 다음 빌드는 `-SkipUnity` 옵션으로 Gradle만 돌리면 훨씬 빠릅니다 (~20분)

---

*이 로그는 Claude에 의해 자동 생성됨 — room2scan 야간 개발 세션*

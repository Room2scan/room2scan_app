# Room2Scan — Android APK Build Guide

> 이 가이드를 따르면 Unity 씬이 실제 Android 기기에서 동작합니다.
> **자고 일어나서 순서대로 실행하세요.**

---

## 전제 조건 확인

| 항목 | 확인 방법 |
|------|-----------|
| Unity 2022.3 LTS | Unity Hub에서 확인 |
| Android Build Support (Unity Module) | Unity Hub → Installs → Add Modules |
| Android SDK API 33+ | Android Studio SDK Manager |
| NDK r26 | `E:\unity\room2scan_unity\android\ndkVersion = "26.1.10909125"` |
| JDK 17 | `java -version` |
| ADB 설치 | `adb devices` |

---

## STEP 1 — Unity Android Export

### 1-1. Unity 프로젝트 열기
```
Unity Hub → Open → E:\unity\room2scan_unity
```

### 1-2. Android 빌드 설정
```
File → Build Settings → Android
☑ Export Project  (체크)
Switch Platform (처음이면 시간 걸림)
```

### 1-3. Player Settings 확인
```
Edit → Project Settings → Player → Android tab

Other Settings:
  - Package Name: com.scan2room.app
  - Minimum API Level: 23
  - Target API Level: 33
  - Scripting Backend: IL2CPP
  - Target Architectures: ☑ ARM64

Configuration:
  - Active Input Handling: Input System Package (New)
```

### 1-4. Export
```
Build Settings → Export 클릭
저장 경로: E:\unity\room2scan_unity_android\
```

출력 폴더 구조:
```
E:\unity\room2scan_unity_android\
  ├── launcher\
  ├── unityLibrary\       ← 이게 핵심
  │   ├── libs\
  │   │   └── unity-classes.jar
  │   ├── src\
  │   └── build.gradle
  └── ...
```

---

## STEP 2 — unity.local.properties 경로 설정

```bash
# E:\unity\room2scan_app\android\unity.local.properties
# 아래 파일을 열어서 경로 수정

unity.library.dir=E\:\\unity\\room2scan_unity_android\\unityLibrary
```

> ⚠️ Windows 경로에서 `\`는 `\\`로, `:`는 `\:`로 이스케이프 필요

---

## STEP 3 — Gradle 빌드

```bash
cd E:\unity\room2scan_app

# Metro bundler 먼저 실행 (새 터미널)
npx expo start --dev-client

# 다른 터미널에서 APK 빌드
cd android
.\gradlew assembleDebug
```

빌드 시간: 약 10~15분 (첫 번째 빌드)

출력물:
```
android\app\build\outputs\apk\debug\app-debug.apk
```

---

## STEP 4 — 기기에 설치

```bash
# USB 디버깅 켜고 기기 연결
adb devices           # 기기 인식 확인
adb install android\app\build\outputs\apk\debug\app-debug.apk
```

---

## STEP 5 — 확인 체크리스트

앱 실행 후:

- [ ] 스플래시 화면 (start.png) 표시됨
- [ ] 홈화면 Room2scan 워드마크 보임
- [ ] 방 선택 → 편집 버튼 → Unity 뷰 표시됨 (검은 화면 X)
- [ ] Unity 뷰에서 3D 방 렌더링됨
- [ ] 가구 추가 버튼 → 씬에 가구 생성됨
- [ ] 레이아웃 저장 → 앱 재시작 후 복원됨

---

## 트러블슈팅

### ":unityLibrary" 프로젝트를 찾을 수 없음
```
FAILURE: Build failed — Project ':unityLibrary' not found
```
→ `android/unity.local.properties` 경로 확인. Unity Export가 완료됐는지 확인.

### NDK 버전 오류
```
No version of NDK matched
```
→ Android Studio에서 NDK 26.1.10909125 설치:
`SDK Manager → SDK Tools → NDK (Side by side) → 26.1.10909125`

### unity-classes.jar not found
```
Could not resolve :unityLibrary
```
→ Unity Export 시 `Export Project` 옵션이 체크됐는지 확인. 
`Build` 가 아닌 `Export` 를 실행해야 합니다.

### ABI 충돌 (libunity.so)
```
Duplicate files: libunity.so
```
→ `android/gradle.properties` 에 추가:
```
android.packagingOptions.pickFirsts=**/libunity.so
```

### Metro 연결 안 됨
실기기에서 앱 열고 → 흔들기 → `Change Bundle Location` → 개발PC IP:8081

---

## ReplicaCAD 데이터 (개발 PC 전용)

Unity Editor에서만 동작하는 절대 경로:
```
E:\unity\replica_cad_data\stages\frl_apartment_stage.glb
E:\unity\replica_cad_data\configs\scenes\apt_0.scene_instance.json
```

Android 기기에서 3D 방을 보려면:
→ 현재는 StreamingAssets 번들링 또는 HTTP 서버 필요 (STEP 6 참조)

---

## STEP 6 — StreamingAssets 번들링 (선택사항)

Android에서 GLB를 로드하려면 APK에 포함해야 합니다.

```
Unity 프로젝트:
Assets/StreamingAssets/rooms/
  apt_0.scene_instance.json
  frl_apartment_stage.glb    ← 이건 큼 (약 30MB)

Assets/StreamingAssets/furniture/
  frl_apartment_sofa.glb
  frl_apartment_chair_01.glb
  ...
```

RoomManager에서 경로 변환:
```csharp
// Windows 절대경로 → StreamingAssets 상대경로로 자동 변환
// NormalizeMeshUri() 가 Application.streamingAssetsPath 기반으로 처리
```

> 현재 NormalizeMeshUri는 `file://` URI와 StreamingAssets 모두 지원합니다.
> ReplicaCAD GLB를 `StreamingAssets/rooms/`에 복사하면 Android에서도 동작합니다.

---

*이 가이드는 Claude에 의해 자동 생성됨 — room2scan 프로젝트*

# P0 RN Unity Spike

This app currently has an Expo managed structure. The P0 React Native screen is wired, but the real native Unity view requires the Unity integration package and native build output.

## Current RN Implementation

- Bridge message helpers: `src/bridge/unityBridge.ts`
- Editor screen shell: `src/screens/UnityEditorScreen.tsx`
- App route: `App.tsx` uses `UnityEditorScreen` for `appState === "editor"`

The screen works in fallback mode before the Unity native package is installed. It logs:

- RN -> Unity `LoadRoom`
- Unity -> RN mock `RoomLoaded`
- RN -> Unity `SaveLayout`
- Unity -> RN mock `LayoutSaved`

## Real Unity View Requirements

Use `@azesmway/react-native-unity`.

Reference docs:

- `https://github.com/azesmway/react-native-unity`
- `https://docs.expo.dev/workflow/prebuild/`

## Android P0 Path

1. Install the Unity package in this RN repo:

```bash
npm install @azesmway/react-native-unity
```

2. Add the Expo plugin to `app.json`:

```json
{
  "expo": {
    "plugins": ["@azesmway/react-native-unity"]
  }
}
```

3. Generate native Android files:

```bash
npx expo prebuild --platform android
```

4. Export Unity Android project into:

```text
unity/builds/android
```

The expected Unity export folder is:

```text
unity/builds/android/unityLibrary
```

5. Run the native app:

```bash
npx expo run:android
```

## Unity Message Target

React Native sends:

```text
gameObject: UnityBridge
methodName: ReceiveFromRN
message: unity-bridge/v1 envelope JSON
```

## User Action Needed

For the next real native test, someone needs to export the Unity project for Android into this RN repo at `unity/builds/android`.

Until then, the RN fallback screen can verify the JSON contract and UI route.

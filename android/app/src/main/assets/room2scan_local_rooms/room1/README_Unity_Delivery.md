# Room1 Unity Delivery

이 폴더는 Unity 쪽에 넘기기 위한 최종 전달 폴더입니다.

## 바로 확인할 파일

- `unity_y_up/previews/room1_empty_plus_assets_placed.glb`
  - 빈 방 위에 최종 가구가 이미 배치된 확인용 GLB입니다.
- `unity_y_up/previews/room1_floorplan_wall_boxes_furniture_boxes.glb`
  - 바닥 도면, 벽 4면 박스, 가구 박스 12개를 한 번에 확인하는 GLB입니다.
- `metadata/room1_unity_delivery_manifest.json`
  - 모든 가구, 벽, 바닥 도면 정보가 들어있는 최종 manifest입니다.

## 폴더 구조

- `unity_y_up/room/`
  - 천장 없는 빈 방 GLB입니다. Unity에서는 이 파일을 static room으로 쓰면 됩니다.
- `unity_y_up/placed_assets/`
  - 이미 방 좌표에 배치된 가구 GLB입니다. 전체 장면 확인용입니다.
- `unity_y_up/movable_assets_local_pivot/`
  - Unity에서 움직이기 쉽도록 각 가구 bbox 중심을 local origin으로 옮긴 GLB입니다.
  - 실제 인터랙션에는 이 폴더의 파일을 쓰는 것을 권장합니다.
- `unity_y_up/movable_collider_boxes_local/`
  - 각 movable 가구의 local collider box 시각화용 GLB입니다.
- `unity_y_up/furniture_boxes_global/`
  - 각 가구의 원래 방 좌표계 global bbox GLB입니다.
- `unity_y_up/wall_boxes/`
  - 벽 4면 static collision box GLB입니다.
- `unity_y_up/floorplan/`
  - 직선화된 바닥 도면 이미지, outline GLB, filled mesh GLB입니다.
- `metadata/`
  - JSON/CSV bbox 정보입니다.

## PLY 버전

모든 `.glb` 파일 옆에 같은 이름의 `.ply` 파일도 추가했습니다.

- 예: `unity_y_up/placed_assets/002_bed-001.glb`
- 대응 PLY: `unity_y_up/placed_assets/002_bed-001.ply`

변환 기준:

- mesh-only GLB는 face가 있는 mesh PLY로 저장했습니다.
- 방/preview처럼 point cloud가 포함된 GLB는 MeshLab에서 보기 쉽도록 point-cloud PLY로 저장했습니다.
- 전체 변환 내역은 `metadata/glb_to_ply_sidecars.json`에 있습니다.

## Unity에서 추천 사용 방식

1. GLB importer를 준비합니다.
   - `glTFast` 같은 glTF/GLB importer를 쓰면 됩니다.

2. 방을 배치합니다.
   - `unity_y_up/room/room1_empty_floor_wall.glb`
   - Transform은 identity로 둡니다.
   - position `(0, 0, 0)`, rotation `(0, 0, 0)`, scale `(1, 1, 1)`

3. 벽 충돌 박스를 만듭니다.
   - `metadata/wall_boxes_unity_y_up.csv` 또는 manifest의 `wall_boxes`를 읽습니다.
   - 각 벽마다 static GameObject를 만들고 `BoxCollider`를 붙입니다.
   - `BoxCollider.center = center`
   - `BoxCollider.size = size`

4. 움직일 가구를 만듭니다.
   - `metadata/furniture_boxes_unity_y_up.csv` 또는 manifest의 `furniture`를 읽습니다.
   - 각 가구마다 parent GameObject를 만듭니다.
   - parent position은 `initial_pos_x/y/z`로 둡니다.
   - parent rotation은 `(0, 0, 0)`, scale은 `(1, 1, 1)`로 시작합니다.
   - `unity_y_up/movable_assets_local_pivot/{id}_local_pivot.glb`를 parent 아래 child로 넣고 local transform은 identity로 둡니다.
   - parent에 `BoxCollider`를 붙입니다.
   - `BoxCollider.center = (0, 0, 0)`
   - `BoxCollider.size = collider_size_x/y/z`

5. 가구 이동/스케일링
   - 이동은 parent GameObject position을 바꾸면 됩니다.
   - 가로/세로/높이 조절은 parent scale을 바꾸거나, mesh child와 BoxCollider.size를 같이 조절하면 됩니다.
   - 충돌 검사는 parent의 BoxCollider 기준으로 하면 됩니다.

## 좌표계

모든 파일은 Unity y-up 좌표로 변환되어 있습니다.

```text
unity_x = room_x
unity_y = room_z
unity_z = -room_y
```

즉 Unity에서는 `unity_y`가 높이 방향입니다.

## 중요한 주의점

- `placed_assets`는 이미 방 좌표에 박힌 mesh입니다. 확인용으로 좋습니다.
- 실제 이동/스케일/충돌 인터랙션에는 `movable_assets_local_pivot`를 쓰는 것이 좋습니다.
- movable asset은 bbox 중심이 local origin이므로 parent를 움직이면 자연스럽게 이동합니다.
- bbox 수치는 `metadata/room1_unity_delivery_manifest.json`과 CSV에 모두 들어 있습니다.

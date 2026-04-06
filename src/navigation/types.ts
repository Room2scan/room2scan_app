export type RootStackParamList = {
  Main: undefined;
  RoomDetail: { roomId: string };
  Camera: { mode: 'room' | 'furniture' };
  Processing: { mode: 'room' | 'furniture' };
  Editor: undefined;
};

export type TabParamList = {
  home: undefined;
  rooms: undefined;
  catalog: undefined;
  settings: undefined;
};

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { HomeScreen } from '../screens/HomeScreen';
import { MyRoomsScreen } from '../screens/MyRoomsScreen';
import { CatalogFlowContainer } from '../screens/CatalogScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { RoomDetailScreen } from '../screens/RoomDetailScreen';
import { PanoramaCameraScreen } from '../screens/PanoramaCameraScreen';
import { ReconstructionScreen } from '../screens/ReconstructionScreen';
import { EditorScreen } from '../screens/EditorScreen';
import { BottomNav } from '../components/Shared';
import { RootStackParamList, TabParamList } from './types';
import { MainTab } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TabBarWrapper = ({ navigation, state }: BottomTabBarProps) => {
  const activeTab = state.routes[state.index].name as MainTab;
  return (
    <BottomNav
      activeTab={activeTab}
      onTabChange={(tab) => navigation.navigate(tab as any)}
    />
  );
};

const TabNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <TabBarWrapper {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="home" component={HomeScreen} />
    <Tab.Screen name="rooms" component={MyRoomsScreen} />
    <Tab.Screen name="catalog" component={CatalogFlowContainer} />
    <Tab.Screen name="settings" component={SettingsScreen} />
  </Tab.Navigator>
);

export const RootNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      gestureEnabled: true,
      animation: 'ios',
    }}
  >
    <Stack.Screen name="Main" component={TabNavigator} />
    <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
    <Stack.Screen
      name="Camera"
      component={PanoramaCameraScreen}
      options={{ animation: 'slide_from_bottom', presentation: 'modal', gestureEnabled: true }}
    />
    <Stack.Screen
      name="Processing"
      component={ReconstructionScreen}
      options={{ animation: 'slide_from_bottom', presentation: 'modal', gestureEnabled: false }}
    />
    <Stack.Screen
      name="Editor"
      component={EditorScreen}
      options={{ animation: 'slide_from_bottom', presentation: 'modal', gestureEnabled: true }}
    />
  </Stack.Navigator>
);

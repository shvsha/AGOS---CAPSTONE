import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Platform } from 'react-native';

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#122A48',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFAFA',
          borderTopWidth: 0,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
            },
            android: {
              elevation: 8,
            },
          }),
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="map" color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="bell.badge" color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="chart.line.uptrend.xyaxis" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="document.on.document" color={color} />,
        }}
      />

      <Tabs.Screen
        name="logout"
        options={{
          title: 'Logout',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="exit" color={color} />,
        }}
      />
    </Tabs>
  );
}
import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Gastos',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'list.bullet.rectangle',
                android: 'receipt',
                web: 'receipt',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="balance"
        options={{
          title: 'Balance',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'chart.pie',
                android: 'pie_chart',
                web: 'pie_chart',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          title: 'Captura',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'bell.badge',
                android: 'notifications',
                web: 'notifications',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
    </Tabs>
  );
}

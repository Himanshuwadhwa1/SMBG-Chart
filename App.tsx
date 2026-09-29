import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDb } from './db';
import EditScreen from './screens/edit/EditScreen';
import ViewScreen from './screens/view/ViewScreen';
import SettingsScreen from './screens/settings/SettingsScreen';
import { ThemeProvider, useTheme } from './state/ThemeContext';

export type RootTabParamList = {
  Edit: undefined;
  View: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function AppNavigator() {
  const { colors } = useTheme();

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Edit"
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { color: colors.text, fontWeight: 'bold' },
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
        }}
      >
        <Tab.Screen 
          name="Edit" 
          component={EditScreen} 
          options={{ title: 'Log / Edit' }} 
        />
        <Tab.Screen 
          name="View" 
          component={ViewScreen} 
          options={{ title: 'SMBG Chart' }} 
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: 'Settings' }} 
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function LoadingScreen({ error }: { error?: string | null }) {
  const { colors } = useTheme();

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.error }]}>Initialization Error</Text>
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Initializing database...</Text>
    </View>
  );
}

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    initDb()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error('Failed to initialize SQLite database:', err);
        setInitError(err.message || 'Failed to initialize database');
      });
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {!dbReady ? <LoadingScreen error={initError} /> : <AppNavigator />}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

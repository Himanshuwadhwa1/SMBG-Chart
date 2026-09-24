import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDb } from './db';
import EditScreen from './screens/edit/EditScreen';
import ViewScreen from './screens/view/ViewScreen';
import SettingsScreen from './screens/settings/SettingsScreen';

export type RootTabParamList = {
  Edit: undefined;
  View: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

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

  if (initError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Initialization Error</Text>
        <Text style={styles.errorText}>{initError}</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Initializing database...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator initialRouteName="Edit">
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
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#cc0000',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
});

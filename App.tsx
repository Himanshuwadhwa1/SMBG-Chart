import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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

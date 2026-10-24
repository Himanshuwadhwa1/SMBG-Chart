import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { initDb } from './db';
import { configureNotificationHandler } from './notifications';
import EditScreen from './screens/edit/EditScreen';
import ViewScreen from './screens/view/ViewScreen';
import SettingsScreen from './screens/settings/SettingsScreen';
import { ErrorBoundary } from './logging';
import { RetentionFlowModal } from './screens/settings/RetentionFlowModal';
import { ThemeProvider, useTheme } from './state/ThemeContext';

const editIconAsset = require('./assets/icons/edit.png');
const viewIconAsset = require('./assets/icons/view.png');
const settingsIconAsset = require('./assets/icons/settings.png');

export type RootTabParamList = {
  Edit: undefined;
  View: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function MotionView({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(8));

  useEffect(() => {
    fadeAnim.setValue(0);
    translateY.setValue(8);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [children]);

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        opacity: fadeAnim,
        transform: [{ translateY }],
      }}
    >
      {children}
    </Animated.View>
  );
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, activeTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomMargin = Math.max(insets.bottom + 8, 16);

  const navBgColor = activeTheme === 'dark' ? '#161b22' : '#ffffff';
  const primaryBlue = activeTheme === 'dark' ? '#58a6ff' : '#0969da';

  const icons: Record<string, { icon: any; label: string }> = {
    Edit: { icon: editIconAsset, label: 'Log' },
    View: { icon: viewIconAsset, label: 'Chart' },
    Settings: { icon: settingsIconAsset, label: 'Settings' },
  };

  return (
    <View
      style={{
        position: 'absolute',
        bottom: bottomMargin,
        left: 16,
        right: 16,
        height: 68,
        borderRadius: 24,
        backgroundColor: navBgColor,
        borderWidth: 2,
        borderColor: primaryBlue,
        borderBottomWidth: 2,
        borderBottomColor: primaryBlue,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        elevation: 20,
        shadowColor: primaryBlue,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: activeTheme === 'dark' ? 0.5 : 0.3,
        shadowRadius: 20,
        paddingHorizontal: 8,
      }}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const itemInfo = icons[route.name] || { icon: editIconAsset, label: route.name };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const activeBg = activeTheme === 'dark' ? '#1f293d' : '#e0edff';
        const activeText = activeTheme === 'dark' ? '#58a6ff' : '#0969da';

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: isFocused ? 4 : 6,
              transform: [{ scale: isFocused ? 1.08 : 1.0 }],
            }}
          >
            <View
              style={{
                width: isFocused ? 58 : 44,
                height: isFocused ? 34 : 26,
                borderRadius: isFocused ? 12 : 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isFocused ? activeBg : 'transparent',
                marginBottom: 2,
              }}
            >
              <Image
                source={itemInfo.icon}
                style={{
                  width: isFocused ? 24 : 20,
                  height: isFocused ? 24 : 20,
                  opacity: isFocused ? 1.0 : 0.45,
                  transform: [{ scale: isFocused ? 1.12 : 1.0 }],
                }}
                resizeMode="contain"
              />
            </View>
            <Text
              style={{
                color: isFocused ? activeText : colors.textSecondary,
                fontSize: isFocused ? 12 : 10.5,
                fontWeight: isFocused ? '800' : '500',
                letterSpacing: 0.1,
                textAlign: 'center',
                includeFontPadding: false,
              }}
            >
              {itemInfo.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AppNavigator() {
  const { colors } = useTheme();

  return (
    <NavigationContainer>
      <RetentionFlowModal />
      <Tab.Navigator
        initialRouteName="Edit"
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.card,
            elevation: 2,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          },
          headerTitleStyle: {
            color: colors.text,
            fontSize: 20,
            fontWeight: '800',
            letterSpacing: 1,
          },
          headerTitleAlign: 'center',
          animation: 'shift',
        }}
      >
        <Tab.Screen 
          name="Edit" 
          options={{
            title: 'Log Reading',
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Image source={editIconAsset} style={{ width: 22, height: 22 }} resizeMode="contain" />
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
                  Log Glucose Reading
                </Text>
              </View>
            ),
          }} 
        >
          {() => (
            <MotionView>
              <EditScreen />
            </MotionView>
          )}
        </Tab.Screen>
        <Tab.Screen 
          name="View" 
          options={{
            title: 'View Chart',
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Image source={viewIconAsset} style={{ width: 22, height: 22 }} resizeMode="contain" />
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
                  SMBG Logbook Chart
                </Text>
              </View>
            ),
          }} 
        >
          {() => (
            <MotionView>
              <ViewScreen />
            </MotionView>
          )}
        </Tab.Screen>
        <Tab.Screen 
          name="Settings" 
          options={{
            title: 'Settings',
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Image source={settingsIconAsset} style={{ width: 22, height: 22 }} resizeMode="contain" />
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
                  App Settings
                </Text>
              </View>
            ),
          }} 
        >
          {() => (
            <MotionView>
              <SettingsScreen />
            </MotionView>
          )}
        </Tab.Screen>
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
    configureNotificationHandler();
    initDb()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error('Failed to initialize SQLite database:', err);
        setInitError(err.message || 'Failed to initialize database');
      });
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          {!dbReady ? <LoadingScreen error={initError} /> : <AppNavigator />}
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, AppState, Text, View, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { api, loadToken, setToken } from './src/api';
import { AppContext } from './src/AppContext';
import { colors, money, space, type } from './src/theme';
import AuthScreen from './src/screens/Auth';
import HomeScreen from './src/screens/Home';
import GuideScreen from './src/screens/Guide';
import ChatScreen from './src/screens/Chat';
import SessionsScreen from './src/screens/Sessions';
import WalletScreen from './src/screens/Wallet';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const headerOpts = { headerStyle: { backgroundColor: colors.brand }, headerTintColor: colors.ink, headerTitleStyle: { fontWeight: '700' } };

function Tabs() {
  const { user } = React.useContext(AppContext);
  return (
    <Tab.Navigator screenOptions={{ ...headerOpts, tabBarActiveTintColor: colors.ink, tabBarInactiveTintColor: colors.muted,
      headerRight: () => <Text style={{ marginRight: space.md, fontWeight: '700' }}>👛 {money(user.wallet_cents)}</Text> }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Dialogue', tabBarIcon: () => <Text>🏠</Text> }} />
      <Tab.Screen name="Sessions" component={SessionsScreen} options={{ tabBarIcon: () => <Text>📅</Text> }} />
      <Tab.Screen name="Wallet" component={WalletScreen} options={{ tabBarIcon: () => <Text>👛</Text> }} />
    </Tab.Navigator>
  );
}

function Maintenance({ retry }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: colors.night }}>
      <Text style={{ fontSize: 56 }}>⚙️</Text>
      <Text style={{ ...type.h1, color: '#fff', marginTop: space.md, textAlign: 'center' }}>Dialogue is under maintenance</Text>
      <Text style={{ color: '#B8C0D9', marginTop: space.sm, textAlign: 'center' }}>We’re improving things and will be back shortly.</Text>
      <Pressable onPress={retry} style={{ marginTop: space.lg, backgroundColor: colors.brand, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 }}>
        <Text style={{ fontWeight: '700' }}>Try again</Text>
      </Pressable>
    </View>
  );
}

export default function App() {
  const [boot, setBoot] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [user, setUser] = useState(null);

  const start = useCallback(async () => {
    try {
      const s = await api('/status');
      setMaintenance(s.maintenance);
      if (!s.maintenance && (await loadToken())) setUser((await api('/me')).user);
    } catch (e) { if (e.status === 401) await setToken(null); }
    setBoot(false);
  }, []);

  useEffect(() => { start(); const sub = AppState.addEventListener('change', s => s === 'active' && start()); return () => sub.remove(); }, [start]);

  // Context value must be stable: screens put these callbacks in effect deps,
  // and a new identity on every render would re-run those effects (and restart chats).
  const setWallet = useCallback(c => setUser(u => (u ? { ...u, wallet_cents: c } : u)), []);
  const onMaintenance = useCallback(() => setMaintenance(true), []);
  const signIn = useCallback(async (token, u) => { await setToken(token); setUser(u); }, []);
  const signOut = useCallback(async () => { await setToken(null); setUser(null); }, []);
  const ctx = useMemo(() => ({ user, setWallet, onMaintenance, signIn, signOut }), [user, setWallet, onMaintenance, signIn, signOut]);

  if (boot) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={colors.brandDeep} size="large" /></View>;
  if (maintenance) return <Maintenance retry={start} />;

  return (
    <AppContext.Provider value={ctx}>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={headerOpts}>
          {user ? (<>
            <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen name="Guide" component={GuideScreen} options={({ route }) => ({ title: route.params.name })} />
            <Stack.Screen name="Chat" component={ChatScreen} options={({ route }) => ({ title: route.params.name })} />
          </>) : <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />}
        </Stack.Navigator>
      </NavigationContainer>
    </AppContext.Provider>
  );
}

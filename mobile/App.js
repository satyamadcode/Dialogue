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
import ReflectionsScreen from './src/screens/Reflections';
import MoodScreen from './src/screens/Mood';
import CoachDashboard from './src/screens/CoachDashboard';
import WelcomeScreen from './src/screens/Welcome';
import { BrandMark, BrandTitle } from './src/BrandMark';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const headerOpts = { headerStyle: { backgroundColor: colors.bg, borderBottomWidth: 3, borderBottomColor: colors.brandDeep }, headerTintColor: colors.ink, headerTitle: () => <BrandTitle /> };

function Tabs() {
  const { user } = React.useContext(AppContext);
  return (
    <Tab.Navigator screenOptions={{ ...headerOpts, headerLeft: () => <View style={{ marginLeft: space.md }}><BrandMark size={30} /></View>, tabBarActiveTintColor: colors.ink, tabBarInactiveTintColor: colors.muted,
      headerRight: () => <Text style={{ marginRight: space.md, fontWeight: '700' }}>👛 {money(user.wallet_cents)}</Text> }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: () => <Text>⌂</Text> }} />
      <Tab.Screen name="Mood" component={MoodScreen} options={{ tabBarIcon: () => <Text>☼</Text> }} />
      <Tab.Screen name="Reflections" component={ReflectionsScreen} options={{ title: 'Journal', tabBarIcon: () => <Text>♡</Text> }} />
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
      <Text style={{ color: colors.onDarkMuted, marginTop: space.sm, textAlign: 'center' }}>We’re improving things and will be back shortly.</Text>
      <Pressable onPress={retry} style={{ marginTop: space.lg, backgroundColor: colors.brand, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 }}>
        <Text style={{ fontWeight: '700' }}>Try again</Text>
      </Pressable>
    </View>
  );
}

export default function App() {
  const [boot, setBoot] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [user, setUser] = useState(null);

  const start = useCallback(async () => {
    try {
      const s = await api('/status');
      setMaintenance(s.maintenance);
      if (!s.maintenance && (await loadToken())) setUser((await api('/me')).user);
      setConnectionError(false);
    } catch (e) {
      if (e.status === 401) {
        await setToken(null);
        setUser(null);
        setConnectionError(false);
      } else {
        setConnectionError(true);
      }
    } finally {
      setBoot(false);
    }
  }, []);

  useEffect(() => { start(); const sub = AppState.addEventListener('change', s => s === 'active' && start()); return () => sub.remove(); }, [start]);

  // Context value must be stable: screens put these callbacks in effect deps,
  // and a new identity on every render would re-run those effects (and restart chats).
  const setWallet = useCallback(c => setUser(u => (u ? { ...u, wallet_cents: c } : u)), []);
  const onMaintenance = useCallback(() => setMaintenance(true), []);
  const signIn = useCallback(async (token, u) => { await setToken(token); setUser(u); }, []);
  const signOut = useCallback(async () => { await setToken(null); setUser(null); }, []);
  const ctx = useMemo(() => ({ user, setWallet, onMaintenance, signIn, signOut }), [user, setWallet, onMaintenance, signIn, signOut]);

  if (boot) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, gap: space.md }}>
      <BrandMark size={74} />
      <Text style={{ ...type.h1, fontSize: 32, color: colors.ink }}>Dialogue</Text>
      <Text style={{ color: colors.muted }}>A little more heard. A little less alone.</Text>
      <ActivityIndicator color={colors.brandDeep} size="small" />
    </View>
  );
  if (maintenance) return <Maintenance retry={start} />;
  if (connectionError) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: colors.bg }}>
      <Text style={{ fontSize: 48 }}>🌿</Text>
      <Text style={{ ...type.h1, color: colors.ink, marginTop: space.md, textAlign: 'center' }}>We’re having trouble connecting</Text>
      <Text style={{ color: colors.muted, marginTop: space.sm, textAlign: 'center' }}>Check your connection and make sure the Dialogue service is running, then try again.</Text>
      <Pressable onPress={() => { setBoot(true); start(); }} style={{ marginTop: space.lg, backgroundColor: colors.brand, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 }}>
        <Text style={{ fontWeight: '700' }}>Try again</Text>
      </Pressable>
    </View>
  );

  return (
    <AppContext.Provider value={ctx}>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={headerOpts}>
          {user ? (user.role === 'coach' ? (
            <Stack.Screen name="Coach" component={CoachDashboard} options={{ title: 'Shared reflections', headerRight: () => <Pressable onPress={ctx.signOut} style={{ marginRight: space.md }}><Text style={{ color: colors.green, fontWeight: '700' }}>Sign out</Text></Pressable> }} />
          ) : (<>
            <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen name="Guide" component={GuideScreen} options={{ title: 'Meet your guide' }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'A conversation' }} />
          </>)) : (<>
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
          </>)}
        </Stack.Navigator>
      </NavigationContainer>
    </AppContext.Provider>
  );
}

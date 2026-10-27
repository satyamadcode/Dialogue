import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { api } from '../api';
import { useApp } from '../AppContext';
import { colors, money, radius, space, type } from '../theme';

export default function Wallet() {
  const { user, setWallet, signOut, onMaintenance } = useApp();
  async function topup(amount) {
    try { setWallet((await api('/wallet/topup', { method: 'POST', body: { amount } })).wallet_cents); }
    catch (e) { e.maintenance ? onMaintenance() : Alert.alert('Error', e.message); }
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: space.md, gap: space.md }}>
      <View style={{ backgroundColor: colors.night, borderRadius: radius.md, padding: space.lg }}>
        <Text style={{ color: '#B8C0D9' }}>Balance</Text>
        <Text style={{ color: '#fff', fontSize: 36, fontWeight: '700' }}>{money(user.wallet_cents)}</Text>
        <Text style={{ color: '#B8C0D9', marginTop: space.xs }}>{user.name} · {user.email}</Text>
      </View>
      <Text style={type.h2}>Add money (demo)</Text>
      <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
        {[10, 25, 50, 100].map(a => (
          <Pressable key={a} onPress={() => topup(a)} style={{ backgroundColor: colors.brand, paddingVertical: 12, paddingHorizontal: 22, borderRadius: radius.pill }}><Text style={{ fontWeight: '700' }}>+ ${a}</Text></Pressable>))}
      </View>
      <Pressable onPress={signOut} style={{ marginTop: 'auto', padding: 14, alignItems: 'center' }}><Text style={{ color: colors.danger, fontWeight: '600' }}>Sign out</Text></Pressable>
    </View>
  );
}

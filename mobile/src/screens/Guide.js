import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { api } from '../api';
import { useApp } from '../AppContext';
import { colors, money, radius, space, type } from '../theme';

const RESOURCES = ['Intake questionnaire', 'Goal-setting worksheet', 'Session recording', 'Follow-up action plan'];

export default function Guide({ route, navigation }) {
  const { id, name } = route.params;
  const { onMaintenance } = useApp();
  const [t, setT] = useState(null);
  const [slot, setSlot] = useState('');
  const [res, setRes] = useState([]);

  useEffect(() => { api('/therapists/' + id).then(setT).catch(e => e.maintenance ? onMaintenance() : Alert.alert('Error', e.message)); }, [id, onMaintenance]);
  if (!t) return null;

  const toggle = r => setRes(a => (a.includes(r) ? a.filter(x => x !== r) : [...a, r]));
  async function book() {
    try { await api('/bookings', { method: 'POST', body: { therapist_id: id, slot, resources: res } }); Alert.alert('Booked', `${slot} with ${name}`); navigation.navigate('Tabs', { screen: 'Sessions' }); }
    catch (e) { Alert.alert('Could not book', e.message); }
  }
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: space.md, gap: space.md }}>
      <View style={card}>
        <Text style={type.h2}>{t.name}</Text>
        <Text style={{ color: colors.muted }}>{t.role} · {money(t.rate_cents_per_hr)}/hr · ★ {t.rating}</Text>
        <Text style={{ marginTop: space.sm }}>{t.bio}</Text>
        <Pressable disabled={!t.online} onPress={() => navigation.navigate('Chat', { id, name })} style={{ marginTop: space.md, padding: 14, borderRadius: radius.pill, alignItems: 'center', backgroundColor: t.online ? colors.green : colors.line }}>
          <Text style={{ color: t.online ? '#fff' : colors.muted, fontWeight: '700' }}>{t.online ? '💬 Chat now · 3 min free' : 'Busy right now, schedule below'}</Text>
        </Pressable>
      </View>
      <View style={card}>
        <Text style={type.h2}>Schedule a consultation</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginVertical: space.sm }}>
          {t.slots.map(s => (
            <Pressable key={s} onPress={() => setSlot(s)} style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, borderColor: slot === s ? colors.brand : colors.line, backgroundColor: slot === s ? colors.brand : colors.card }}>
              <Text style={{ fontWeight: '600' }}>{s}</Text>
            </Pressable>))}
        </View>
        <Text style={{ fontWeight: '600', marginBottom: space.xs }}>Resources to share</Text>
        {RESOURCES.map(r => (
          <View key={r} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 }}>
            <Text>{r}</Text><Switch value={res.includes(r)} onValueChange={() => toggle(r)} trackColor={{ true: colors.brand }} />
          </View>))}
        <Pressable disabled={!slot} onPress={book} style={{ marginTop: space.md, padding: 14, borderRadius: radius.pill, alignItems: 'center', backgroundColor: slot ? colors.brand : colors.line }}>
          <Text style={{ fontWeight: '700' }}>Confirm booking</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
const card = { backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, borderWidth: 1, borderColor: colors.line };

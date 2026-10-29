import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useApp } from '../AppContext';
import { colors, radius, space, type } from '../theme';

const MOODS = [
  { key: 'great', face: '☀️', label: 'Bright' },
  { key: 'good', face: '🙂', label: 'Good' },
  { key: 'okay', face: '😐', label: 'Okay' },
  { key: 'low', face: '🌧️', label: 'Low' },
  { key: 'rough', face: '🌧️', label: 'Hard' },
];
const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function Mood() {
  const { onMaintenance } = useApp();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [entries, setEntries] = useState({});
  const [selected, setSelected] = useState(dateKey(new Date()));
  const [mood, setMood] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api(`/moods?year=${month.getFullYear()}&month=${month.getMonth() + 1}`);
      const mapped = Object.fromEntries(data.map(entry => [entry.entry_date, entry]));
      setEntries(mapped);
      const current = mapped[selected];
      setMood(current?.mood || '');
      setNote(current?.note || '');
    } catch (e) {
      if (e.maintenance) onMaintenance();
      else Alert.alert('Could not load your mood calendar', e.message);
    }
  }, [month, onMaintenance, selected]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const monthLabel = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  function chooseDay(key) {
    setSelected(key);
    setMood(entries[key]?.mood || '');
    setNote(entries[key]?.note || '');
    setError('');
  }

  async function save() {
    if (!mood) {
      setError('Choose the feeling that fits today.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api(`/moods/${selected}`, { method: 'PUT', body: { mood, note } });
      await load();
    } catch (e) {
      if (e.maintenance) onMaintenance();
      else setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: space.md, gap: space.md }}>
      <View>
        <Text style={type.h1}>Your mood, your pace</Text>
        <Text style={{ color: colors.muted, marginTop: space.xs }}>A small check-in can help you notice how things are changing.</Text>
      </View>
      <View style={card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md }}>
          <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Text style={arrow}>‹</Text></Pressable>
          <Text style={type.h2}>{monthLabel}</Text>
          <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Text style={arrow}>›</Text></Pressable>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <Text key={`${day}-${index}`} style={weekday}>{day}</Text>)}
          {Array.from({ length: offset }, (_, i) => <View key={`empty-${i}`} style={dayCell} />)}
          {Array.from({ length: days }, (_, i) => {
            const key = dateKey(new Date(month.getFullYear(), month.getMonth(), i + 1));
            const selectedDay = selected === key;
            const entry = entries[key];
            const face = MOODS.find(option => option.key === entry?.mood)?.face;
            return (
              <Pressable key={key} onPress={() => chooseDay(key)} style={[dayCell, selectedDay && { backgroundColor: colors.category, borderColor: colors.brandDeep }]}>
                <Text style={{ color: colors.ink, fontSize: 12 }}>{i + 1}</Text>
                <Text style={{ height: 18, fontSize: 12 }}>{face || ''}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={card}>
        <Text style={type.h2}>How are you feeling?</Text>
        <Text style={{ ...type.small, color: colors.muted, marginTop: 3 }}>{selected}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.md }}>
          {MOODS.map(option => (
            <Pressable key={option.key} onPress={() => { setMood(option.key); setError(''); }} style={{ alignItems: 'center', minWidth: 48, paddingVertical: 6, paddingHorizontal: 4, borderRadius: 14, backgroundColor: mood === option.key ? colors.category : 'transparent' }}>
              <Text style={{ fontSize: 21 }}>{option.face}</Text>
              <Text style={{ color: colors.muted, fontSize: 10, marginTop: 3 }}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput multiline value={note} onChangeText={setNote} placeholder="Want to add a little context? (optional)" placeholderTextColor={colors.muted} style={{ minHeight: 72, textAlignVertical: 'top', backgroundColor: '#FAFCF9', borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: space.md, color: colors.ink, marginTop: space.md }} />
        {error ? <Text accessibilityRole="alert" style={{ color: colors.danger, marginTop: space.sm }}>{error}</Text> : null}
        <Pressable disabled={saving} onPress={save} style={{ marginTop: space.md, padding: 13, borderRadius: radius.pill, alignItems: 'center', backgroundColor: colors.green, opacity: saving ? 0.6 : 1 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{saving ? 'Saving…' : 'Save check-in'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const card = { backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, borderWidth: 1, borderColor: colors.line };
const dayCell = { width: '14.285%', minHeight: 46, borderWidth: 1, borderColor: 'transparent', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 2 };
const weekday = { width: '14.285%', textAlign: 'center', color: colors.muted, fontSize: 12, fontWeight: '700', paddingBottom: 8 };
const arrow = { color: colors.green, fontSize: 28, paddingHorizontal: 8 };

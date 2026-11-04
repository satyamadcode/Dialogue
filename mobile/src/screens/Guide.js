import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { api } from '../api';
import { useApp } from '../AppContext';
import { ScrollMotionProvider, ScrollReveal, useScrollMotion } from '../ScrollMotion';
import { colors, money, radius, screen, space, type } from '../theme';

const RESOURCES = ['Intake questionnaire', 'Goal-setting worksheet', 'Session recording', 'Follow-up action plan'];
const SERVICES = [
  { id: 'clarity', name: '1:1 Clarity Session', duration: 30, detail: 'Untangle one thing and leave with a next step.' },
  { id: 'alignment', name: 'Growth Alignment', duration: 60, detail: 'Make room for a deeper reset and a clear plan.' },
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const initials = name => name.replace('Dr. ', '').split(' ').map(word => word[0]).join('');
const formatTime = time => {
  const [hour, minute] = time.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${period}`;
};
const localDateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function makeDates() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index + 1);
    return {
      date: localDateKey(date),
      day: WEEKDAYS[date.getDay()],
      number: date.getDate(),
      month: date.toLocaleDateString(undefined, { month: 'short' }),
      weekday: date.toLocaleDateString(undefined, { weekday: 'short' }),
    };
  });
}

function DateOption({ item, available, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !available, selected }}
      disabled={!available}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 62,
        minHeight: 82,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: selected ? colors.brandDeep : available ? colors.line : 'transparent',
        backgroundColor: selected ? colors.brandDeep : available ? colors.card : 'transparent',
        opacity: available ? (pressed ? 0.78 : 1) : 0.44,
      })}
    >
      <Text style={{ ...type.small, color: selected ? colors.onBrand : colors.muted, fontWeight: '600' }}>{item.weekday}</Text>
      <Text style={{ fontSize: 21, lineHeight: 27, color: selected ? colors.onBrand : colors.ink, fontWeight: '700', marginVertical: 2 }}>{item.number}</Text>
      <Text style={{ ...type.small, color: selected ? '#092012' : colors.muted }}>{item.month}</Text>
    </Pressable>
  );
}

export default function Guide({ route, navigation }) {
  const scrollMotion = useScrollMotion();
  const { id, name } = route.params;
  const { onMaintenance } = useApp();
  const [therapist, setTherapist] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [service, setService] = useState(SERVICES[0]);
  const [resources, setResources] = useState([]);
  const [booking, setBooking] = useState(false);
  const dates = useMemo(makeDates, []);

  useEffect(() => {
    api('/therapists/' + id)
      .then(setTherapist)
      .catch(error => error.maintenance ? onMaintenance() : Alert.alert('Could not load coach', error.message));
  }, [id, onMaintenance]);

  const availability = useMemo(() => {
    if (!therapist) return {};
    return Object.fromEntries(dates.map(date => [
      date.date,
      therapist.slots.filter(slot => slot.startsWith(date.day + ' ')),
    ]));
  }, [dates, therapist]);

  useEffect(() => {
    if (!selectedDate && dates.some(date => availability[date.date]?.length)) {
      setSelectedDate(dates.find(date => availability[date.date]?.length).date);
    }
  }, [availability, dates, selectedDate]);

  const times = (availability[selectedDate] || []).map(slot => slot.slice(4)).sort();
  const groupedTimes = [
    { title: 'Morning', icon: '☀', times: times.filter(time => Number(time.slice(0, 2)) < 12) },
    { title: 'Afternoon', icon: '◒', times: times.filter(time => Number(time.slice(0, 2)) >= 12 && Number(time.slice(0, 2)) < 17) },
    { title: 'Evening', icon: '☾', times: times.filter(time => Number(time.slice(0, 2)) >= 17) },
  ].filter(group => group.times.length);

  function chooseDate(date) {
    setSelectedDate(date);
    setSelectedTime('');
  }

  function toggleResource(resource) {
    setResources(current => current.includes(resource)
      ? current.filter(item => item !== resource)
      : [...current, resource]);
  }

  async function book() {
    if (!selectedDate || !selectedTime || booking) return;
    setBooking(true);
    try {
      const slot = `${selectedDate} ${selectedTime}`;
      await api('/bookings', {
        method: 'POST',
        body: { therapist_id: id, slot, session_type: service.id, resources },
      });
      Alert.alert('You’re booked', `${service.name} with ${name} · ${slot}`);
      navigation.navigate('Tabs', { screen: 'Sessions' });
    } catch (error) {
      Alert.alert('Could not book', error.message);
    } finally {
      setBooking(false);
    }
  }

  if (!therapist) return <View style={{ ...screen, flex: 1, backgroundColor: colors.bg }} />;

  const selectedDateItem = dates.find(date => date.date === selectedDate);
  const coachFirstName = therapist.name.replace(/^Dr\.\s*/, '').split(' ')[0];
  const canBook = Boolean(selectedDate && selectedTime && !booking);

  return (
    <ScrollMotionProvider scrollY={scrollMotion.scrollY}>
    <View style={{ ...screen, flex: 1, backgroundColor: 'transparent' }}>
      <Animated.ScrollView
        onScroll={scrollMotion.onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 142, gap: 26 }}
      >
        <ScrollReveal>
        <View style={{
          position: 'relative', overflow: 'hidden', backgroundColor: colors.brand,
          borderRadius: 26, padding: 22, minHeight: 194, justifyContent: 'center',
        }}>
          <Animated.View style={{ position: 'absolute', width: 148, height: 148, borderRadius: 74, right: -40, top: 24, backgroundColor: colors.green, opacity: 0.18, transform: [{ translateY: scrollMotion.scrollY.interpolate({ inputRange: [0, 500], outputRange: [0, -28], extrapolate: 'clamp' }) }] }} />
          <Animated.View style={{ position: 'absolute', width: 94, height: 94, borderRadius: 47, right: -10, top: 51, backgroundColor: colors.accent, opacity: 0.22, alignItems: 'center', justifyContent: 'center', transform: [{ translateY: scrollMotion.scrollY.interpolate({ inputRange: [0, 500], outputRange: [0, -16], extrapolate: 'clamp' }) }] }}>
            <Text style={{ color: colors.onBrand, fontSize: 43, lineHeight: 52 }}>✳</Text>
          </Animated.View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent }} />
            <Text style={{ ...type.small, color: '#FFE0BC', fontWeight: '700', letterSpacing: 1.35, textTransform: 'uppercase' }}>A moment for you</Text>
          </View>
          <Text style={{ maxWidth: '78%', fontFamily: 'serif', fontSize: 34, lineHeight: 39, color: '#FFFCFA', marginTop: 12, letterSpacing: -0.55 }}>Make space for you.</Text>
          <Text style={{ maxWidth: '74%', ...type.body, color: '#DDF5E4', marginTop: 9, lineHeight: 23 }}>Thoughtful support, at a pace that feels right.</Text>
          <Text style={{ color: '#FFE0BC', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 18 }}>YOUR NEXT CHAPTER STARTS HERE  ↗</Text>
        </View>
        </ScrollReveal>

        <ScrollReveal>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: space.md,
          padding: 18, backgroundColor: colors.category, borderRadius: 22,
          borderWidth: 1, borderColor: colors.line,
          shadowColor: colors.night, shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 2,
        }}>
          <View style={{
            width: 62, height: 62, borderRadius: 31, backgroundColor: colors.avatarPalette[therapist.id % colors.avatarPalette.length],
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{initials(therapist.name)}</Text>
            <View style={{ position: 'absolute', right: 0, bottom: 1, width: 13, height: 13, borderRadius: 7, borderWidth: 2, borderColor: colors.card, backgroundColor: therapist.online ? colors.online : colors.offline }} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, lineHeight: 24, color: colors.ink, fontWeight: '700' }}>{therapist.name}</Text>
            <Text style={{ ...type.small, color: colors.muted, marginTop: 4 }}>{therapist.role} · {therapist.exp_years} years of experience</Text>
            <Text style={{ ...type.small, color: colors.accent, fontWeight: '700', marginTop: 7 }}>★ {therapist.rating}  ·  {therapist.online ? 'Here when you’re ready' : 'Currently in a session'}</Text>
          </View>
        </View>
        </ScrollReveal>

        <ScrollReveal><View style={{ backgroundColor: colors.card, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: colors.line }}>
          <Text style={{ ...type.h2, color: colors.ink, fontFamily: 'serif', fontSize: 20 }}>A little about {coachFirstName}</Text>
          <Text style={{ ...type.body, color: colors.muted, marginTop: 9, lineHeight: 24 }}>{therapist.full_bio || therapist.bio}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {therapist.tags.split(',').map(tag => (
              <Text key={tag} style={{ ...type.small, color: colors.accent, backgroundColor: colors.category, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, fontWeight: '600' }}>
                ·  {tag.trim()}
              </Text>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={!therapist.online}
            onPress={() => navigation.navigate('Chat', { id, name })}
            style={({ pressed }) => ({
              marginTop: space.md, minHeight: 46, justifyContent: 'center', alignItems: 'center',
              borderRadius: radius.pill, backgroundColor: therapist.online ? colors.highlight : colors.line,
              borderWidth: 1, borderColor: therapist.online ? colors.accent : colors.line,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ color: therapist.online ? colors.accent : colors.muted, fontWeight: '700' }}>
              {therapist.online ? 'Start a conversation' : 'Currently in a session'}
            </Text>
          </Pressable>
        </View></ScrollReveal>

        <ScrollReveal><View>
          <Text style={{ ...type.h2, color: colors.ink, fontFamily: 'serif', fontSize: 22, marginBottom: 14 }}>Choose your session</Text>
          <View style={{ gap: 12 }}>
            {SERVICES.map(item => {
              const active = service.id === item.id;
              const price = Math.ceil(therapist.rate_cents_per_hr * item.duration / 60);
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  key={item.id}
                  onPress={() => setService(item)}
                  style={({ pressed }) => ({
                    padding: 18, borderRadius: 20, borderWidth: active ? 1.5 : 1,
                    borderColor: active ? colors.accent : colors.line,
                    backgroundColor: active ? colors.highlight : colors.card, opacity: pressed ? 0.84 : 1,
                  })}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.sm }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                        <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5,                         borderColor: active ? colors.brandDeep : colors.line, alignItems: 'center', justifyContent: 'center' }}>
                          {active && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />}
                        </View>
                        <Text style={{ ...type.h2, color: colors.ink, flex: 1 }}>{item.name}</Text>
                      </View>
                      <Text style={{ ...type.small, color: colors.muted, marginTop: 8, marginLeft: 27, lineHeight: 19 }}>{item.duration} minutes  ·  {item.detail}</Text>
                    </View>
                    <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '700' }}>{money(price)}</Text>
                  </View>
                  {active && <Text style={{ ...type.small, color: colors.accent, fontWeight: '600', marginTop: 12, marginLeft: 27 }}>Selected  ·  session rate, no charge at booking</Text>}
                </Pressable>
              );
            })}
          </View>
        </View></ScrollReveal>

        <ScrollReveal><View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: space.sm }}>
            <Text style={{ ...type.h2, color: colors.ink, fontFamily: 'serif', fontSize: 22 }}>Choose a day</Text>
            <Text style={{ ...type.small, color: colors.muted }}>NEXT 2 WEEKS</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.xs, paddingVertical: 2 }}>
            {dates.map(date => (
              <DateOption
                key={date.date}
                item={date}
                available={Boolean(availability[date.date]?.length)}
                selected={selectedDate === date.date}
                onPress={() => chooseDate(date.date)}
              />
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.sm }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
            <Text style={{ ...type.small, color: colors.muted }}>Available</Text>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.line, marginLeft: space.sm }} />
            <Text style={{ ...type.small, color: colors.muted }}>Unavailable</Text>
          </View>
        </View></ScrollReveal>

        <ScrollReveal><View style={{
          backgroundColor: colors.card, borderRadius: 20, padding: 20,
          borderWidth: 1, borderColor: colors.line,
        }}>
          <Text style={{ ...type.h2, color: colors.ink, fontFamily: 'serif', fontSize: 22 }}>Choose a time</Text>
          <Text style={{ ...type.small, color: colors.muted, marginTop: 6 }}>
            {selectedDateItem ? `${selectedDateItem.weekday}, ${selectedDateItem.month} ${selectedDateItem.number}` : 'Select an available day to see times'}
          </Text>
          {groupedTimes.length ? groupedTimes.map(group => (
            <View key={group.title} style={{ marginTop: space.md }}>
              <Text style={{ ...type.small, color: colors.accent, fontWeight: '700', letterSpacing: 0.2, marginBottom: 10 }}>{group.icon}  {group.title}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {group.times.map(time => {
                  const active = selectedTime === time;
                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      key={time}
                      onPress={() => setSelectedTime(time)}
                      style={({ pressed }) => ({
                        minWidth: 94, alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12,
                        borderRadius: radius.pill, borderWidth: 1,
                        borderColor: active ? colors.brandDeep : colors.line,
                        backgroundColor: active ? colors.brandDeep : colors.card, opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <Text style={{ color: active ? colors.onBrand : colors.ink, fontSize: 14, fontWeight: '600' }}>{formatTime(time)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )) : (
            <Text style={{ ...type.small, color: colors.muted, marginTop: space.md }}>
              {selectedDate ? 'No times are available on this day. Choose another date.' : 'Choose a highlighted day to see available times.'}
            </Text>
          )}
        </View></ScrollReveal>

        <ScrollReveal><View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.line }}>
          <Text style={{ ...type.h2, color: colors.ink, fontFamily: 'serif', fontSize: 22 }}>A little preparation</Text>
          <Text style={{ ...type.small, color: colors.muted, marginTop: 6, marginBottom: 12, lineHeight: 19 }}>Choose anything you’d like to share before you meet.</Text>
          {RESOURCES.map((resource, index) => (
            <View key={resource} style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingVertical: 12, borderTopWidth: index ? 1 : 0, borderColor: colors.line,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1, paddingRight: space.sm }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent }} />
                <Text style={{ ...type.body, color: colors.ink, flex: 1 }}>{resource}</Text>
              </View>
              <Switch
                accessibilityLabel={`Share ${resource}`}
                value={resources.includes(resource)}
                onValueChange={() => toggleResource(resource)}
                trackColor={{ false: colors.line, true: colors.brandDeep }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View></ScrollReveal>
      </Animated.ScrollView>

      <View style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 13, paddingBottom: 18,
        backgroundColor: 'rgba(8,11,9,0.98)', borderTopWidth: 1, borderTopColor: colors.line,
      }}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canBook, busy: booking }}
          disabled={!canBook}
          onPress={book}
          style={({ pressed }) => ({
            minHeight: 56, alignItems: 'center', justifyContent: 'center',
            borderRadius: 18, backgroundColor: canBook ? colors.brandDeep : colors.disabled,
            opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.99 : 1 }],
            shadowColor: colors.brandDeep, shadowOpacity: canBook ? 0.16 : 0, shadowRadius: 15, shadowOffset: { width: 0, height: 6 }, elevation: 3,
          })}
        >
          <Text style={{ color: canBook ? colors.onBrand : colors.ink, fontSize: 15, fontWeight: '700', letterSpacing: 0.2 }}>
            {booking ? 'Confirming your session…' : 'Confirm my session'}
          </Text>
        </Pressable>
        <Text style={{ ...type.small, color: colors.muted, textAlign: 'center', marginTop: 7 }}>
          {selectedDateItem && selectedTime ? `${service.duration} min  ·  ${selectedDateItem.month} ${selectedDateItem.number} at ${formatTime(selectedTime)}` : 'Choose a day and time to continue'}
        </Text>
      </View>
    </View>
    </ScrollMotionProvider>
  );
}

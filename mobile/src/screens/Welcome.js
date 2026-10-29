import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BrandMark } from '../BrandMark';
import { colors, radius, space, type } from '../theme';

export default function Welcome({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: space.lg }}>
      <View style={{ width: '100%', maxWidth: 360, alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: 28, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }}>
        <BrandMark size={64} />
        <Text style={{ ...type.h1, fontSize: 30, color: colors.ink }}>Dialogue</Text>
        <Text style={{ textAlign: 'center', color: colors.muted, lineHeight: 22 }}>A little more heard. A little less alone.</Text>
        <View style={{ width: '100%', alignItems: 'center', marginTop: space.sm, padding: space.md, borderRadius: radius.md, backgroundColor: '#F3F7F1' }}>
          <Text style={{ fontSize: 25 }}>☕  ↔  ☕</Text>
          <Text style={{ ...type.h2, color: colors.ink, textAlign: 'center', marginTop: space.sm }}>There’s room for a real conversation.</Text>
          <Text style={{ color: colors.muted, textAlign: 'center', lineHeight: 20, marginTop: space.xs }}>Meet a thoughtful person who can listen and help you find your next step.</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Auth', { mode: 'register' })} style={{ width: '100%', padding: 14, borderRadius: radius.pill, backgroundColor: colors.green, alignItems: 'center', marginTop: space.xs }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Create an account</Text>
        </Pressable>
        <Text style={{ color: colors.muted, textAlign: 'center' }}>
          Already with us?{' '}
          <Text accessibilityRole="link" onPress={() => navigation.navigate('Auth', { mode: 'login' })} style={{ color: colors.green, fontWeight: '700' }}>Sign in</Text>
        </Text>
        <Pressable onPress={() => navigation.navigate('Auth', { mode: 'login', accountType: 'coach' })}>
          <Text accessibilityRole="link" style={{ color: colors.muted, fontSize: 12, textDecorationLine: 'underline' }}>Coach sign in</Text>
        </Pressable>
      </View>
    </View>
  );
}

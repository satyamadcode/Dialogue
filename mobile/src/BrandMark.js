import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from './theme';

export function BrandMark({ size = 42 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E4EFE3', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size * 0.68} height={size * 0.68} viewBox="0 0 32 32">
        <Circle cx="11" cy="10" r="4" fill={colors.brandDeep} />
        <Circle cx="22" cy="10" r="4" fill={colors.green} />
        <Path d="M3.5 26c.5-5.3 3.2-8 7.5-8s7 2.7 7.5 8" fill={colors.brandDeep} />
        <Path d="M13.5 26c.5-5.3 3.2-8 7.5-8s7 2.7 7.5 8" fill={colors.green} />
        <Path d="M13 14h6m-2-2 2 2-2 2" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

export function BrandTitle() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      <BrandMark size={30} />
      <Text style={{ color: colors.ink, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 }}>Dialogue</Text>
    </View>
  );
}

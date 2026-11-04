import React from 'react';
import { Image, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from './theme';

export function BrandMark({ size = 42 }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size * 0.34, backgroundColor: colors.brandDeep,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: colors.brandDeep, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3,
    }}>
      <Svg width={size * 0.82} height={size * 0.82} viewBox="0 0 44 44">
        <Path d="M9 10a6 6 0 0 1 6-6h11a6 6 0 0 1 6 6v3a6 6 0 0 1-6 6h-4l-5 4v-4h-2a6 6 0 0 1-6-6z" fill={colors.accent} />
        <Path d="M7 23a6 6 0 0 1 6-6h16a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6h-7l-6 5v-5h-3a6 6 0 0 1-6-6z" fill="#FFFFFF" />
        <Circle cx="17" cy="26" r="1.3" fill={colors.brandDeep} />
        <Circle cx="22" cy="26" r="1.3" fill={colors.brandDeep} />
        <Circle cx="27" cy="26" r="1.3" fill={colors.brandDeep} />
      </Svg>
    </View>
  );
}

export function BrandTitle() {
  return (
    <Image
      source={require('../assets/untold-logo.png')}
      resizeMode="contain"
      accessibilityLabel="Untold"
      style={{ width: 132, height: 34 }}
    />
  );
}

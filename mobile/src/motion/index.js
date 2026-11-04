import React from 'react';
import { Pressable } from 'react-native';
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { motion } from './tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function useReduceMotion() {
  return useReducedMotion();
}

export function useScrollY() {
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });
  return { scrollY, onScroll };
}

export function FadeInUp({ children, delay = 0, style }) {
  const reduceMotion = useReduceMotion();
  const entering = reduceMotion
    ? undefined
    : FadeInDown.duration(motion.duration.slow).delay(delay);

  return <Animated.View entering={entering} style={style}>{children}</Animated.View>;
}

export function PressableScale({ children, onPressIn, onPressOut, style, tiltOnLongPress = false, ...props }) {
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);
  const tilt = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: reduceMotion ? 1 : scale.value },
      { rotateY: `${reduceMotion ? 0 : tilt.value}deg` },
    ],
  }), [reduceMotion]);

  return (
    <AnimatedPressable
      {...props}
      onPressIn={event => {
        if (!reduceMotion) scale.value = withSpring(0.97, motion.easing);
        onPressIn?.(event);
      }}
      onLongPress={event => {
        if (!reduceMotion && tiltOnLongPress) tilt.value = withSpring(-2, motion.easing);
        props.onLongPress?.(event);
      }}
      onPressOut={event => {
        if (!reduceMotion) {
          scale.value = withSpring(1, motion.easing);
          tilt.value = withSpring(0, motion.easing);
        }
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

export function ParallaxOrb({ scrollY, size, color, top, left, right, speed = 0.14, opacity = 0.2 }) {
  const reduceMotion = useReduceMotion();
  const animatedStyle = useAnimatedStyle(() => ({
    opacity,
    transform: [{
      translateY: reduceMotion
        ? 0
        : interpolate(scrollY.value, [0, 900], [0, -900 * speed], 'clamp'),
    }],
  }), [opacity, reduceMotion, speed]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        top,
        left,
        right,
      }, animatedStyle]}
    />
  );
}

export function useCollapsingHeaderStyle(scrollY) {
  const reduceMotion = useReduceMotion();
  return useAnimatedStyle(() => ({
    opacity: reduceMotion ? 1 : interpolate(scrollY.value, [0, 140], [1, 0.2], 'clamp'),
    transform: [
      { scale: reduceMotion ? 1 : interpolate(scrollY.value, [0, 140], [1, 0.94], 'clamp') },
      { translateY: reduceMotion ? 0 : interpolate(scrollY.value, [0, 140], [0, -16], 'clamp') },
    ],
  }), [reduceMotion]);
}

export function useCompactHeaderStyle(scrollY) {
  const reduceMotion = useReduceMotion();
  return useAnimatedStyle(() => ({
    opacity: reduceMotion ? (scrollY.value > 100 ? 1 : 0) : interpolate(scrollY.value, [90, 180], [0, 1], 'clamp'),
    transform: [{ translateY: reduceMotion ? 0 : interpolate(scrollY.value, [90, 180], [-8, 0], 'clamp') }],
  }), [reduceMotion]);
}

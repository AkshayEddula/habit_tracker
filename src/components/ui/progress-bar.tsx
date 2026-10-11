import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

type Props = { progress: number; color: string; track: string; height?: number };

export function ProgressBar({ progress, color, track, height = 10 }: Props) {
  const value = useSharedValue(0);

  useEffect(() => {
    value.set(withTiming(Math.max(0, Math.min(1, progress)), { duration: 600 }));
  }, [progress, value]);

  const fill = useAnimatedStyle(() => ({ width: `${value.get() * 100}%` }));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: track }]}>
      <Animated.View style={[styles.fill, { borderRadius: height / 2, backgroundColor: color }, fill]}>
        <View style={[styles.shine, { borderRadius: height / 2 }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden', width: '100%' },
  fill: { height: '100%' },
  shine: {
    position: 'absolute',
    top: '18%',
    left: 6,
    right: 6,
    height: '26%',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});

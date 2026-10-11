import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Rays, Spin } from '@/components/holo';
import { Icon } from '@/components/ui/icon';

type Props = {
  /** Background of the hero area (and of the overscroll above it). */
  color: string;
  /** Slowly turning rays behind the hero. Pass the ray color to enable them. */
  rays?: string;
  /** Whether the hero is a saturated color (white close button) or a pale one (dark close button). */
  onColor?: boolean;
  hero: ReactNode;
  children: ReactNode;
  onClose: () => void;
};

/**
 * Shared layout for the app's sheets, in the same language as the streak screens:
 * a full-bleed colored hero, with a white panel curving up beneath it.
 */
export function SheetScaffold({ color, rays, onColor = true, hero, children, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: color }]}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bounces={false}>
        <View style={[styles.hero, { paddingTop: insets.top + 22 }]}>
          {rays && (
            <View style={styles.rays}>
              <Spin duration={40000}>
                <Rays size={640} color={rays} opacity={1} count={16} />
              </Spin>
            </View>
          )}
          {hero}
        </View>
        <View style={[styles.panel, { paddingBottom: insets.bottom + 28 }]}>{children}</View>
      </ScrollView>

      <Pressable
        onPress={onClose}
        style={[styles.close, { top: insets.top + 12, backgroundColor: onColor ? 'rgba(0,0,0,0.14)' : '#FFFFFF' }]}
        accessibilityLabel="Close"
        hitSlop={10}>
        <Icon ios="xmark" md="close" size={16} color={onColor ? '#FFFFFF' : '#777777'} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: { alignItems: 'center', paddingBottom: 56, paddingHorizontal: 22, overflow: 'hidden' },
  rays: { position: 'absolute', top: -160, alignSelf: 'center', pointerEvents: 'none' },
  panel: {
    flexGrow: 1,
    marginTop: -30,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderCurve: 'continuous',
    paddingHorizontal: 22,
    paddingTop: 26,
    gap: 20,
  },
  close: {
    position: 'absolute',
    right: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

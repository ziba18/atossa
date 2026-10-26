// Show on screen — the same summary model in large, high-contrast type (body 20/28, quotes 26/34,
// ink on white), for handing the phone across the desk. It covers the whole screen, tab bar
// included: the route hosts a full-screen RN Modal (the tab bar lives in the tabs layout, which a
// nested stack screen can't cover on Android or web). The screen stays awake while it's open.
import React, { useState } from 'react';
import { Modal, Platform, ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { colors, layout, space } from '../../../constants/atossaUI';
import { Button, EmptyState } from '../../../components/atossa/kit';
import { DocumentView } from '../../../components/atossa/doctor/DocumentView';
import { useDoctorDoc } from '../../../components/atossa/doctor/useDoctorDoc';

/** Web: hand focus back to the page so the next tap after closing isn't swallowed. */
function releaseWebFocus() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  (document.activeElement as HTMLElement | null)?.blur?.();
}

export default function ShowOnScreen() {
  useKeepAwake(undefined, { suppressDeactivateWarnings: true });
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { doc } = useDoctorDoc();
  const pageWidth = Math.min(width, layout.maxContentWidth);
  // The Done bar is a solid strip above the document (never floating over it); a hairline appears
  // under it once the document has scrolled beneath.
  const [scrolled, setScrolled] = useState(false);
  const close = () => {
    releaseWebFocus();
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/doctor' as any);
  };

  return (
    <Modal visible animationType={Platform.OS === 'web' ? 'none' : 'slide'} presentationStyle="fullScreen" onRequestClose={close} statusBarTranslucent>
      {/* RN Modal renders outside the app's provider tree on native, so give it its own insets. */}
      <SafeAreaProvider>
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.surface }}>
          <View
            style={{
              flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: space.md, paddingVertical: space.xs,
              backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: scrolled ? colors.hairline : 'transparent',
              zIndex: 1,
            }}
          >
            <Button label="Done" icon="x" variant="secondary" onPress={close} accessibilityLabel="Close Show on screen" style={{ paddingHorizontal: space.xl }} />
          </View>
          {doc.empty ? (
            <EmptyState message="Nothing to share yet." />
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ alignItems: 'center', paddingBottom: space.xxxl }}
              scrollEventThrottle={32}
              // Web only: lets keyboard users focus and scroll the document.
              {...(Platform.OS === 'web' ? ({ tabIndex: 0 } as object) : {})}
              onScroll={(e) => {
                const next = e.nativeEvent.contentOffset.y > 2;
                if (next !== scrolled) setScrolled(next);
              }}
            >
              <DocumentView doc={doc} variant="large" width={pageWidth} />
            </ScrollView>
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

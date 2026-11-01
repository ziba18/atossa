import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, space } from '../../constants/atossaUI';
import { Button, Txt } from '../atossa/kit';
import { PreLoginHelp } from '../help/PreLoginHelp';
import type { StartupPhase } from '../../lib/startup';

/**
 * DRAFT words pending Safety C146 (PRD pm/prd/start-up-waking.md req. 2 + 5): do not ship without Safety GO.
 * No error codes, no blame, nothing to buy.
 */
export const STARTUP_WAKING_LINE = 'Opening your notes… this can take up to a minute.';
export const STARTUP_UNREACHABLE_TITLE = 'Can’t reach Atossa right now';
export const STARTUP_UNREACHABLE_LINE = 'Nothing has been deleted. Please try again in a moment.';
export const STARTUP_TRY_AGAIN = 'Try again';

/** The opening screen while her tokens exist and the start-up check has no answer yet. Never Welcome. */
export function StartupScreen({ phase, onRetry, retrying }: { phase: StartupPhase; onRetry: () => void; retrying?: boolean }) {
  const unreachable = phase === 'unreachable' && !retrying;
  return (
    <SafeAreaView role="main" edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.column}>
        <Txt variant="headline" color={colors.plum} accessibilityRole="header" accessibilityLabel="Atossa">Atossa</Txt>
        {unreachable ? (
          <View style={styles.block} accessibilityLiveRegion="assertive">
            <Txt variant="title" accessibilityRole="header">{STARTUP_UNREACHABLE_TITLE}</Txt>
            <Txt variant="body" color={colors.ink2}>{STARTUP_UNREACHABLE_LINE}</Txt>
            <Button label={STARTUP_TRY_AGAIN} onPress={onRetry} />
          </View>
        ) : (
          <View style={styles.block} accessibilityLiveRegion="polite">
            <ActivityIndicator size="large" color={colors.plum} accessibilityLabel="Opening" />
            {phase === 'waking' || retrying ? <Txt variant="body" color={colors.ink2}>{STARTUP_WAKING_LINE}</Txt> : null}
          </View>
        )}
        {/* Help now is one tap away with zero API calls (PRD req. 6): the start-up retries pause while it is open. */}
        {phase === 'checking' && !retrying ? null : <PreLoginHelp style={styles.help} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  column: { flex: 1, justifyContent: 'center', padding: space.xl, gap: space.lg, maxWidth: 560, width: '100%', alignSelf: 'center' },
  block: { gap: space.md, alignItems: 'flex-start' },
  help: { marginTop: space.md },
});

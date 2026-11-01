import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, space } from '../../constants/atossaUI';
import { Button, Txt } from '../atossa/kit';
import { PreLoginHelp } from '../help/PreLoginHelp';
import type { StartupPhase } from '../../lib/startup';

/**
 * Safety C146 GO words (safety/run65-c146-c147-startup-words-lint.md, 1 Nov 2026): do not edit without Safety.
 * 'Your notes are still saved' is true only while tokens and the outbox are kept: never show this screen on the 401/403 path.
 */
export const STARTUP_WAKING_LINE = 'Opening your notes… this can take up to a minute.';
export const STARTUP_UNREACHABLE_TITLE = 'Can’t reach Atossa right now';
export const STARTUP_UNREACHABLE_LINE = 'Your notes are still saved. Check your connection, then try again.';
export const STARTUP_TRY_AGAIN = 'Try again';

/** The opening screen while her tokens exist and the start-up check has no answer yet. Never Welcome. */
export function StartupScreen({ phase, onRetry, retrying }: { phase: StartupPhase; onRetry: () => void; retrying?: boolean }) {
  const unreachable = phase === 'unreachable' && !retrying;
  return (
    <SafeAreaView role="main" edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.column}>
        <Txt variant="headline" color={colors.plum} accessibilityRole="header" accessibilityLabel="Atossa" style={styles.wordmark}>Atossa</Txt>
        {unreachable ? (
          <View style={styles.block} accessibilityLiveRegion="assertive">
            <Txt variant="title" accessibilityRole="header">{STARTUP_UNREACHABLE_TITLE}</Txt>
            <Txt variant="body" color={colors.ink2}>{STARTUP_UNREACHABLE_LINE}</Txt>
            <Button label={STARTUP_TRY_AGAIN} onPress={onRetry} />
          </View>
        ) : (
          <View style={styles.block} accessibilityLiveRegion="polite">
            <ActivityIndicator size="large" style={{ alignSelf: 'flex-start' }} color={colors.plum} accessibilityLabel="Opening" />
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
  wordmark: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 34, fontWeight: '400' },
  block: { gap: space.md, alignItems: 'stretch' },
  help: { marginTop: space.md },
});

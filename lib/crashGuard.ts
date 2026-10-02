// Keeps a JavaScript error from taking the whole app down in release builds.
//
// By default React Native hands a fatal JS error to the native side, which
// raises an Objective-C exception from a background thread. On iOS 26 that
// path corrupts the Hermes heap and the app dies with a SIGSEGV that hides the
// original message (TestFlight build 22, 2026-09-25; react-native#54859).
// In release builds we keep the error in JS instead and let the root layout
// show it on screen, so the app stays open and we can read what went wrong.
// Development builds keep React Native's red error screen.

type Listener = () => void;

let fatalError: Error | null = null;
const listeners = new Set<Listener>();

function setFatalError(error: Error | null) {
  fatalError = error;
  listeners.forEach((l) => l());
}

export function getFatalError(): Error | null {
  return fatalError;
}

export function clearFatalError() {
  setFatalError(null);
}

export function subscribeFatalError(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

if (!__DEV__ && typeof ErrorUtils !== 'undefined') {
  const defaultHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    if (!isFatal) {
      defaultHandler(error, isFatal);
      return;
    }
    console.error(error);
    setFatalError(error instanceof Error ? error : new Error(String(error)));
  });
}

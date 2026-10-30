// When a session expires the phone signs out, but notes still waiting to send must stay until the same
// account signs in again. A plain flag read once by the tabs layout when it resets the records store.
let expired = false;

export const markSessionExpired = () => { expired = true; };

/** True once after a session expiry; the next call returns false. */
export function consumeSessionExpired(): boolean {
  const was = expired;
  expired = false;
  return was;
}

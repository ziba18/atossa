// Fixed "Help now" routes (source: nhs.uk, help for suicidal thoughts). Same for everyone, no trigger, reads no notes.
// COPY PENDING SAFETY SIGN-OFF: Safety's ruling can change the words, not the row.
export const SAMARITANS_NUMBER = '116 123';

export interface HelpRoute { id: string; label: string; detail: string; href: string; a11y: string }

export const HELP_ROUTES: HelpRoute[] = [
  { id: '999', label: '999 or A&E', detail: 'If you might harm yourself or are in danger now', href: 'tel:999', a11y: 'Call 999' },
  { id: '111', label: 'NHS 111', detail: 'Urgent help that is not an emergency', href: 'tel:111', a11y: 'Call NHS 111' },
  { id: 'samaritans', label: `Samaritans ${SAMARITANS_NUMBER}`, detail: 'Free, any time, someone to listen', href: `tel:${SAMARITANS_NUMBER.replace(/ /g, '')}`, a11y: `Call Samaritans on ${SAMARITANS_NUMBER}` },
  { id: 'shout', label: 'Text SHOUT to 85258', detail: 'Free text support, any time', href: 'sms:85258?body=SHOUT', a11y: 'Text SHOUT to 85258' },
];

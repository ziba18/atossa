// The Atossa UI kit — "Warm Paper, Deep Ink". Import everything UI from here:
//   import { ScreenLarge, Card, Button, Txt, showToast } from '../../components/atossa/kit';
// Reference + usage rules: design/KIT.md. Tokens: constants/atossaUI.ts.
// Implementation lives in ./kit-parts/* (split only to keep files readable).

export { Txt, Quote, curly, type TxtVariant } from './kit-parts/Txt';
export { FieldLabel } from './kit-parts/FieldLabel';
export {
  Button, IconButton, AddButton, Chip, ChipGroup, AddFieldChip, SegmentedControl, DatePill,
  type ButtonVariant, type ChipOption,
} from './kit-parts/controls';
export { SeverityRow, SeverityTag } from './kit-parts/severity';
export { DayChooser } from './kit-parts/DayChooser';
export { Sheet, useReduceMotion, type SheetProps } from './kit-parts/Sheet';
export { FadeIn } from './kit-parts/FadeIn';
export { SkeletonCards } from './kit-parts/Skeleton';
export { ToastHost, showToast, dismissToast } from './kit-parts/toast';
export {
  ScreenLarge, HeaderAvatar, BackChevron, SectionTitle, Card, PressableCard, HeroNumber, NotedRow, FactLine,
  EmptyState, InlineError, SafetyLine, SAFETY_TEXT, ConfirmCard, GlyphLine,
  type CardTone, type ConfirmAction,
} from './kit-parts/layout';
export {
  TextField, SwitchRow, Toggle,
  // legacy (auth / onboarding / profile sub-screens) — don't use in new screens
  MainHeader, Screen, PageTitle, SectionHeading, Section, BigButton, BackButton, StepProgress,
  LoadingScreen, ErrorScreen, SuccessNote, Upcoming, RecordRow, ConfirmDelete, FutureDateMessage,
} from './kit-parts/legacy';

// "Plans for pregnancy" store (A27 proposal). The chip on For my doctor saves a `fertility_wish` record
// ({ wish, chosenAt }); the newest one is the answer. A note can only OFFER a pre-selected chip from her
// own sentence (holistic `fertility`); nothing is saved until she taps it, and nothing comes from
// other people's sentences, a pregnancy test, or a worry ("will I be able to have kids").
import { FERTILITY_OPTIONS, type FertilityWish } from './summary';
import type { Holistic } from '../../components/atossa/capture/holistic';

export interface FertilityWishData {
  wish: FertilityWish;
  chosenAt: string;
}

/** The newest saved choice, or null when she never chose (the A4 then says "Not recorded"). */
export function latestFertilityWish(recs: { data: FertilityWishData }[]): FertilityWish | null {
  let best: FertilityWishData | null = null;
  for (const r of recs) {
    if (!(FERTILITY_OPTIONS as readonly string[]).includes(r.data.wish)) continue;
    if (!best || r.data.chosenAt > best.chosenAt) best = r.data;
  }
  return best ? best.wish : null;
}

/** A suggestion for the chip, shown with her words; null once she has chosen (her tap always wins). */
export function fertilityOffer(h: Pick<Holistic, 'fertility'>, saved: FertilityWish | null): { wish: FertilityWish; words: string } | null {
  if (saved || !h.fertility) return null;
  return { wish: h.fertility.wish, words: h.fertility.words };
}

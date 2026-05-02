import { useWindowDimensions } from 'react-native';
import { MAX_CONTENT_WIDTH } from '../constants/theme';

export function useContentWidth(): number {
  const { width } = useWindowDimensions();
  return Math.min(width, MAX_CONTENT_WIDTH);
}

/**
 * Icon component — inline Lucide SVG icons via react-native-svg.
 * Source: https://github.com/lucide-icons/lucide (MIT license)
 * All icons use viewBox "0 0 24 24", stroke-based, fill="none".
 */
import React from 'react';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';

export type IconName =
  | 'activity'
  | 'alert-circle'
  | 'arrow-left'
  | 'arrow-right'
  | 'bandage'
  | 'bar-chart'
  | 'bell'
  | 'book-open'
  | 'brain'
  | 'calendar'
  | 'check'
  | 'check-circle'
  | 'chevron-left'
  | 'chevron-right'
  | 'clipboard-list'
  | 'clock'
  | 'dna'
  | 'droplet'
  | 'droplets'
  | 'eye'
  | 'eye-off'
  | 'file-text'
  | 'flower'
  | 'heart'
  | 'heart-pulse'
  | 'house'
  | 'info'
  | 'leaf'
  | 'link'
  | 'log-out'
  | 'map-pin'
  | 'message-circle'
  | 'minus'
  | 'pencil'
  | 'pill'
  | 'play'
  | 'plus'
  | 'refresh'
  | 'scroll-text'
  | 'send'
  | 'settings'
  | 'shield'
  | 'sparkles'
  | 'star'
  | 'stethoscope'
  | 'thermometer'
  | 'trash'
  | 'trending-up'
  | 'triangle-alert'
  | 'user'
  | 'x'
  | 'zap';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  const shared = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  const renderInner = () => {
    switch (name) {

      case 'activity':
        return <Path {...shared} d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />;

      case 'alert-circle':
        return (
          <>
            <Circle {...shared} cx="12" cy="12" r="10" />
            <Line {...shared} x1="12" y1="8" x2="12" y2="12" />
            <Line {...shared} x1="12" y1="16" x2="12.01" y2="16" />
          </>
        );

      case 'arrow-left':
        return (
          <>
            <Path {...shared} d="m12 19-7-7 7-7" />
            <Path {...shared} d="M19 12H5" />
          </>
        );

      case 'arrow-right':
        return (
          <>
            <Path {...shared} d="M5 12h14" />
            <Path {...shared} d="m12 5 7 7-7 7" />
          </>
        );

      case 'bandage':
        return (
          <>
            <Rect {...shared} x="2" y="6" width="20" height="12" rx="2" />
            <Path {...shared} d="M18 6v12" />
            <Path {...shared} d="M6 6v12" />
            <Path {...shared} d="M10 10h.01" />
            <Path {...shared} d="M14 10h.01" />
            <Path {...shared} d="M10 14h.01" />
            <Path {...shared} d="M14 14h.01" />
          </>
        );

      case 'bar-chart':
        return (
          <>
            <Path {...shared} d="M5 21v-6" />
            <Path {...shared} d="M12 21V3" />
            <Path {...shared} d="M19 21V9" />
          </>
        );

      case 'bell':
        return (
          <>
            <Path {...shared} d="M10.268 21a2 2 0 0 0 3.464 0" />
            <Path {...shared} d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
          </>
        );

      case 'book-open':
        return (
          <>
            <Path {...shared} d="M12 7v14" />
            <Path {...shared} d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
          </>
        );

      case 'brain':
        return (
          <>
            <Path {...shared} d="M12 18V5" />
            <Path {...shared} d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" />
            <Path {...shared} d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" />
            <Path {...shared} d="M17.997 5.125a4 4 0 0 1 2.526 5.77" />
            <Path {...shared} d="M18 18a4 4 0 0 0 2-7.464" />
            <Path {...shared} d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" />
            <Path {...shared} d="M6 18a4 4 0 0 1-2-7.464" />
            <Path {...shared} d="M6.003 5.125a4 4 0 0 0-2.526 5.77" />
          </>
        );

      case 'calendar':
        return (
          <>
            <Rect {...shared} x="3" y="4" width="18" height="18" rx="2" />
            <Path {...shared} d="M8 2v4" />
            <Path {...shared} d="M16 2v4" />
            <Path {...shared} d="M3 10h18" />
          </>
        );

      case 'check':
        return <Path {...shared} d="M20 6 9 17l-5-5" />;

      case 'check-circle':
        return (
          <>
            <Circle {...shared} cx="12" cy="12" r="10" />
            <Path {...shared} d="m9 12 2 2 4-4" />
          </>
        );

      case 'chevron-left':
        return <Path {...shared} d="m15 18-6-6 6-6" />;

      case 'chevron-right':
        return <Path {...shared} d="m9 18 6-6-6-6" />;

      case 'clipboard-list':
        return (
          <>
            <Rect {...shared} x="8" y="2" width="8" height="4" rx="1" />
            <Path {...shared} d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <Path {...shared} d="M12 11h4" />
            <Path {...shared} d="M12 16h4" />
            <Path {...shared} d="M8 11h.01" />
            <Path {...shared} d="M8 16h.01" />
          </>
        );

      case 'clock':
        return (
          <>
            <Circle {...shared} cx="12" cy="12" r="10" />
            <Path {...shared} d="M12 6v6l4 2" />
          </>
        );

      case 'dna':
        return (
          <>
            <Path {...shared} d="m10 16 1.5 1.5" />
            <Path {...shared} d="m14 8-1.5-1.5" />
            <Path {...shared} d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
            <Path {...shared} d="m16.5 10.5 1 1" />
            <Path {...shared} d="m17 6-2.891-2.891" />
            <Path {...shared} d="M2 15c6.667-6 13.333 0 20-6" />
            <Path {...shared} d="m20 9 .891.891" />
            <Path {...shared} d="M3.109 14.109 4 15" />
            <Path {...shared} d="m6.5 12.5 1 1" />
            <Path {...shared} d="m7 18 2.891 2.891" />
            <Path {...shared} d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
          </>
        );

      case 'droplet':
        return <Path {...shared} d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />;

      case 'droplets':
        return (
          <>
            <Path {...shared} d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
            <Path {...shared} d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
          </>
        );

      case 'eye':
        return (
          <>
            <Path {...shared} d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
            <Circle {...shared} cx="12" cy="12" r="3" />
          </>
        );

      case 'eye-off':
        return (
          <>
            <Path {...shared} d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
            <Path {...shared} d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
            <Path {...shared} d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
            <Path {...shared} d="m2 2 20 20" />
          </>
        );

      case 'file-text':
        return (
          <>
            <Path {...shared} d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2z" />
            <Path {...shared} d="M14 2v6h6" />
            <Path {...shared} d="M10 9H8" />
            <Path {...shared} d="M16 13H8" />
            <Path {...shared} d="M16 17H8" />
          </>
        );

      case 'flower':
        return (
          <>
            <Path {...shared} d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V9m-4.5 3a4.5 4.5 0 1 0 4.5 4.5M7.5 12H9m7.5 0a4.5 4.5 0 1 1-4.5 4.5m4.5-4.5H15m-3 4.5V15" />
            <Circle {...shared} cx="12" cy="12" r="3" />
            <Path {...shared} d="m8 16 1.5-1.5" />
          </>
        );

      case 'heart':
        return <Path {...shared} d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />;

      case 'heart-pulse':
        return (
          <>
            <Path {...shared} d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
            <Path {...shared} d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
          </>
        );

      case 'house':
        return (
          <>
            <Path {...shared} d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
            <Path {...shared} d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </>
        );

      case 'info':
        return (
          <>
            <Circle {...shared} cx="12" cy="12" r="10" />
            <Path {...shared} d="M12 16v-4" />
            <Path {...shared} d="M12 8h.01" />
          </>
        );

      case 'leaf':
        return (
          <>
            <Path {...shared} d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <Path {...shared} d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </>
        );

      case 'link':
        return (
          <>
            <Path {...shared} d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <Path {...shared} d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </>
        );

      case 'log-out':
        return (
          <>
            <Path {...shared} d="m16 17 5-5-5-5" />
            <Path {...shared} d="M21 12H9" />
            <Path {...shared} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          </>
        );

      case 'map-pin':
        return (
          <>
            <Path {...shared} d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
            <Circle {...shared} cx="12" cy="10" r="3" />
          </>
        );

      case 'message-circle':
        return <Path {...shared} d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />;

      case 'minus':
        return <Path {...shared} d="M5 12h14" />;

      case 'pencil':
        return (
          <>
            <Path {...shared} d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
            <Path {...shared} d="m15 5 4 4" />
          </>
        );

      case 'pill':
        return (
          <>
            <Path {...shared} d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
            <Path {...shared} d="m8.5 8.5 7 7" />
          </>
        );

      case 'play':
        return <Path {...shared} d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />;

      case 'plus':
        return (
          <>
            <Path {...shared} d="M5 12h14" />
            <Path {...shared} d="M12 5v14" />
          </>
        );

      case 'refresh':
        return (
          <>
            <Path {...shared} d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <Path {...shared} d="M21 3v5h-5" />
            <Path {...shared} d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <Path {...shared} d="M8 16H3v5" />
          </>
        );

      case 'scroll-text':
        return (
          <>
            <Path {...shared} d="M15 12h-5" />
            <Path {...shared} d="M15 8h-5" />
            <Path {...shared} d="M19 17V5a2 2 0 0 0-2-2H4" />
            <Path {...shared} d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />
          </>
        );

      case 'send':
        return (
          <>
            <Path {...shared} d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
            <Path {...shared} d="m21.854 2.147-10.94 10.939" />
          </>
        );

      case 'settings':
        return (
          <>
            <Path {...shared} d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
            <Circle {...shared} cx="12" cy="12" r="3" />
          </>
        );

      case 'shield':
        return <Path {...shared} d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />;

      case 'sparkles':
        return (
          <>
            <Path {...shared} d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
            <Path {...shared} d="M20 3v4" />
            <Path {...shared} d="M22 5h-4" />
            <Path {...shared} d="M4 17v2" />
            <Path {...shared} d="M5 18H3" />
          </>
        );

      case 'star':
        return <Path {...shared} d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />;

      case 'stethoscope':
        return (
          <>
            <Path {...shared} d="M11 2v2" />
            <Path {...shared} d="M5 2v2" />
            <Path {...shared} d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
            <Path {...shared} d="M8 15a6 6 0 0 0 12 0v-3" />
            <Circle {...shared} cx="20" cy="10" r="2" />
          </>
        );

      case 'thermometer':
        return <Path {...shared} d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />;

      case 'trash':
        return (
          <>
            <Path {...shared} d="M3 6h18" />
            <Path {...shared} d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <Path {...shared} d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <Path {...shared} d="M10 11v6" />
            <Path {...shared} d="M14 11v6" />
          </>
        );

      case 'trending-up':
        return (
          <>
            <Path {...shared} d="M16 7h6v6" />
            <Path {...shared} d="m22 7-8.5 8.5-5-5L2 17" />
          </>
        );

      case 'triangle-alert':
        return (
          <>
            <Path {...shared} d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
            <Path {...shared} d="M12 9v4" />
            <Path {...shared} d="M12 17h.01" />
          </>
        );

      case 'user':
        return (
          <>
            <Path {...shared} d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <Circle {...shared} cx="12" cy="7" r="4" />
          </>
        );

      case 'x':
        return (
          <>
            <Path {...shared} d="M18 6 6 18" />
            <Path {...shared} d="m6 6 12 12" />
          </>
        );

      case 'zap':
        return <Path {...shared} d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />;

      default:
        return null;
    }
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {renderInner()}
    </Svg>
  );
}

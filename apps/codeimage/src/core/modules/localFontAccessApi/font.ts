import {FontMetricsWithContext} from '@core/modules/localFontAccessApi/fontMetrics';

export function isMonospaced(metrics: FontMetricsWithContext) {
  return metrics.charWidth(' ').width === metrics.charWidth('M').width;
}

export function determineFontFaceName(familyStyle: string) {
  let subfamily = familyStyle.toLowerCase();
  subfamily = subfamily.replaceAll(' ', '');
  subfamily = subfamily.replaceAll('-', '');
  subfamily = subfamily.replaceAll('_', '');

  let face: string;
  switch (true) {
    case subfamily.includes('thin'): {
      face = '100';
      break;
    }
    case subfamily.includes('extralight'): {
      face = '200';
      break;
    }
    case subfamily.includes('light'): {
      face = '300';
      break;
    }
    case subfamily.includes('medium'): {
      face = '500';
      break;
    }
    case subfamily.includes('semibold'): {
      face = '600';
      break;
    }
    case subfamily.includes('extrabold'): {
      face = '800';
      break;
    }
    case subfamily.includes('ultrabold'): {
      face = '900';
      break;
    }
    case subfamily.includes('bold'): {
      face = '700';
      break;
    }
    default: {
      face = '400';
    }
  }
  if (subfamily.includes('italic')) {
    // face += 'i';
    // TODO: Currently italic font are not needed. Skipping this one.
    return null;
  }

  return face;
}

export const fontWeightLabelMap: Record<number, string> = {
  100: 'Thin',
  200: 'Extra Light',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'Semi Bold',
  700: 'Bold',
  800: 'Extra Bold',
  900: 'Black',
};

import type * as ApiTypes from '@codeimage/api/api-types';

type Terminal = NonNullable<
  ApiTypes.CreateProjectApi['request']['body']
>['terminal'];

export function projectTerminal(terminal: Terminal | undefined) {
  const {
    background,
    opacity,
    shadow,
    type,
    textColor,
    accentVisible,
    alternativeTheme,
    surface,
    borderType,
    showGlassReflection,
    showHeader,
    showWatermark,
  } = terminal ?? {};
  return {
    background: background ?? '',
    opacity: opacity ?? 100,
    shadow,
    type,
    textColor: textColor ?? '',
    accentVisible: accentVisible ?? true,
    alternativeTheme: alternativeTheme ?? false,
    surface: surface ?? 'solid',
    borderType: borderType ?? null,
    showGlassReflection: showGlassReflection ?? false,
    showHeader: showHeader ?? false,
    showWatermark: showWatermark ?? false,
  };
}

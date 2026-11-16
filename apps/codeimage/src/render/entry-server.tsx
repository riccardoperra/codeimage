import '../assets/styles/app.scss';
import '../theme/global.css';

import type {CommentTokens} from '@codemirror/commands';
import {EditorState} from '@codemirror/state';

import {parseAnnotations} from '@core/diff/parseAnnotations';

import {THEME_REGISTRY} from '@codeimage/store/theme/themeRegistry';
import {SUPPORTED_FONTS} from '@core/configuration/font';
import {loadLanguage} from '@core/snapshot/tokenize';

export {SUPPORTED_FONTS};
export {composeFrame} from './composeFrame';
export {renderAnimationScenes} from './animationScenes';
export async function annotateCode(
  code: string,
  languageId: string,
  tabName: string,
) {
  const language = await loadLanguage(languageId, tabName);
  const state = EditorState.create({
    doc: code,
    extensions: language ? [language] : [],
  });
  return parseAnnotations(
    code,
    state.languageDataAt<CommentTokens>('commentTokens', 0)[0] ?? {},
  );
}

export const SUPPORTED_FONT_IDS = SUPPORTED_FONTS.map(font => font.id);

export const SUPPORTED_THEME_IDS = THEME_REGISTRY.map(theme => theme.id);

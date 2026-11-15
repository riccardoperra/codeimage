import type {
  SignaturePlatform,
  SignaturePosition,
  SignatureStyle,
} from '@codeimage/store/frame/model';
import type {ExportTargetId} from '@codeimage/config';
import {factory, nullable, primaryKey} from '@mswjs/data';

export const db = factory({
  project: {
    id: primaryKey(String),
    name: String,
    createdAt: Date,
    updatedAt: Date,
    ownerId: String,
    isOwner: Boolean,
    editorOptions: {
      id: String,
      fontId: String,
      themeId: String,
      showLineNumbers: Boolean,
      fontWeight: Number,
    },
    editorTabs: Array,
    animation: nullable(
      {
        steps: Array,
        transitionMs: Number,
        easing: (): 'smooth' | 'snappy' | 'linear' => 'smooth',
        fps: (): 24 | 30 | 50 | 60 => 30,
      },
      {defaultsToNull: true},
    ),
    terminal: {
      id: String,
      textColor: String,
      accentVisible: Boolean,
      type: String,
      showWatermark: Boolean,
      alternativeTheme: Boolean,
      surface: () => 'solid',
      borderType: nullable(String),
      showHeader: Boolean,
      showGlassReflection: Boolean,
      opacity: Number,
      shadow: nullable(String),
    },
    frame: {
      aspectRatio: nullable((): string | null => null),
      exportTarget: nullable((): ExportTargetId | null => null),
      signature: nullable(
        {
          handle: String,
          position: (): SignaturePosition => 'bottom-right',
          style: (): SignatureStyle => 'minimal',
          platform: nullable((): SignaturePlatform | null => null),
          name: nullable(String),
          avatar: nullable(String),
          profile: nullable(String),
          savedId: nullable(String),
        },
        {defaultsToNull: true},
      ),
      id: String,
      opacity: Number,
      radius: Number,
      padding: Number,
      visible: Boolean,
      background: nullable(String),
    },
  },
});

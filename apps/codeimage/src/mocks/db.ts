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
          position: (): 'bottom-left' | 'bottom-right' => 'bottom-right',
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

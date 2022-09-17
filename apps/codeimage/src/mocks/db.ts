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
      showHeader: Boolean,
      showGlassReflection: Boolean,
      opacity: Number,
      shadow: nullable(String),
    },
    frame: {
      id: String,
      opacity: Number,
      radius: Number,
      padding: Number,
      visible: Boolean,
      background: nullable(String),
    },
  },
});

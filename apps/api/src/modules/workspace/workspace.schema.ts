import S from 'fluent-json-schema';

const editorOptionsCreateRequest = S.object()
  .id('editorOptionsCreateRequest')
  .prop('fontId', S.string().description('The font id of the snippet'))
  .prop('fontWeight', S.number().description('The font weight of the snippet'))
  .prop(
    'showLineNumbers',
    S.boolean().description('Show/hide the editor line numbers'),
  )
  .prop('themeId', S.string().description('The theme id of the snippet'));

const snippetFrameCreateRequest = S.object()
  .id('snippetFrameCreateRequest')
  .prop(
    'background',
    S.string().description('The background color of the frame'),
  )
  .prop('opacity', S.number().description('The opacity of the frame'))
  .prop('radius', S.number().description('The radius of the frame'))
  .prop('padding', S.number().description('The padding of the frame'))
  .prop('visible', S.boolean().description('Show/hide the background frame'));

const snippetEditorTabsCreateRequest = S.array()
  .id('snippetEditorTabsCreateRequest')
  .items(
    S.object()
      .prop('code', S.string().description('The code of the tab'))
      .prop(
        'languageId',
        S.string().description(
          'The CodeMirror6 language package id of the tab',
        ),
      )
      .prop('tabName', S.string().description('The name of the tab')),
  );

const snippetTerminalCreateRequest = S.object()
  .id('snippetTerminalCreateRequest')
  .prop(
    'accentVisible',
    S.boolean().description('Show/hide the terminal accent tab'),
  )
  .prop(
    'alternativeTheme',
    S.boolean().description('Use the alternative theme'),
  )
  .prop(
    'background',
    S.string().description('The background color of the terminal'),
  )
  .prop('opacity', S.number().description('The opacity of the terminal'))
  .prop('shadow', S.string().description('The shadow of the editor frame'))
  .prop(
    'showGlassReflection',
    S.boolean().description('Show/hide the glass reflection'),
  )
  .prop('showHeader', S.boolean().description('Show/hide the terminal header'))
  .prop('showWatermark', S.boolean().description('Show/hide the watermark'))
  .prop('textColor', S.string().description('The text color of the terminal'))
  .prop('type', S.string().description('The type of the terminal'));

export const workspaceCreateRequestSchema = S.object()
  .id('workspaceCreateRequest')
  .prop('name', S.string().description('The name of the snippet').required())
  .prop('editorOptions', editorOptionsCreateRequest)
  .required()
  .prop('frame', snippetFrameCreateRequest)
  .required()
  .prop('terminal', snippetTerminalCreateRequest)
  .required()
  .prop('editors', snippetEditorTabsCreateRequest)
  .required();

export const workspaceCreateResponseSchema = S.object()
  .id('workspaceCreateResponse')
  .prop('id', S.string().description('The id of the snippet'))
  .prop('createdAt', S.string().description('The creation date of the snippet'))
  .prop(
    'updatedAt',
    S.string().description('The last update date of the snippet'),
  )
  .prop('name', S.string().description('The name of the snippet'))
  .required()
  .prop('editorOptions', editorOptionsCreateRequest)
  .required()
  .prop('snippetFrame', snippetFrameCreateRequest)
  .required()
  .prop('terminal', snippetTerminalCreateRequest)
  .required()
  .prop('editorTabs', snippetEditorTabsCreateRequest)
  .required();

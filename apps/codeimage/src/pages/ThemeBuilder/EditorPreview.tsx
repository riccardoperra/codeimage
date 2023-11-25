import CustomEditorPreview from './CustomEditorPreview';

export function EditorPreview() {
  const exampleCode =
    'interface ValidatorOptions {\n' +
    '    minLength?: number,\n' +
    '}\n' +
    '\n' +
    'type ValidatorDescriptor = {\n' +
    '    options: ValidatorOptions,\n' +
    '};\n' +
    '\n' +
    'const transform = (param: string | number) =>\n' +
    '    typeof param === "string" ? param : param.toString();\n' +
    '\n' +
    'function globalFunction({ options = {} }: ValidatorDescriptor) {\n' +
    '    const { minLength } = options;\n' +
    '\n' +
    '    /**\n' +
    '     * @description Validator\n' +
    '     * @param {string?} value - parameter description\n' +
    '     */\n' +
    '    const localFunction = (value: string) => {\n' +
    '        let isValid = value?.length >= minLength ?? 3; // line comment\n' +
    '        /* Block comment */\n' +
    '        isValid = isValid && (/^\\d.[A-F]+$/i).test(value);\n' +
    '        return {\n' +
    '            isValid,\n' +
    '        };\n' +
    '    };\n' +
    '}\n' +
    '\n' +
    '@defineElement("download-button")\n' +
    'class DownloadButton<T extends ButtonProps> extends HTMLButtonElement {\n' +
    '    static STATIC_FIELD = `<span title="HTML injection">${globalVariable}</span>`;\n' +
    '\n' +
    '    static get observedAttributes(): string[] {\n' +
    "        return ['data-test'];\n" +
    '    }\n' +
    '\n' +
    '    #field = { prop: 1 };\n' +
    '\n' +
    '    public method(props: T) {\n' +
    '        this.click();\n' +
    '\n' +
    '        label:\n' +
    '            while (true) {\n' +
    '                break label;\n' +
    '            }\n' +
    '    }\n' +
    '}\n' +
    '\n' +
    'enum EnumName {\n' +
    '    EnumMember,\n' +
    '}\n' +
    '\n' +
    'module Test {\n' +
    '    declare function run(): void;\n' +
    '}\n' +
    '\n' +
    'export const EXPORTED_VARIABLE = 1;\n' +
    'export function exportedFunction() {}\n' +
    'export class ExportedClass {}\n' +
    '\n' +
    '\n' +
    '#';

  return (
    <CustomEditorPreview
      themeId={''}
      languageId={'typescript'}
      code={exampleCode}
    />
  );
}

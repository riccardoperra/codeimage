export const PREVIEW_CODE =
  'var globalVar;\n' +
  '/**\n' +
  ' * Constructor for AjaxRequest class\n' +
  ' * @param {string} url the url for the request<p/>\n' +
  ' */\n' +
  'function AjaxRequest(url) {\n' +
  '  function local() {}\n' +
  '  var urls = [ "www.cnn.com", 5, globalVar];\n' +
  '  this.request = new XMLHttpRequest();\n' +
  '  url = url.replace(/^\\s*(.*)/, "$1"); // skip leading whitespace\n' +
  '  /* check the url to be in urls */\n' +
  '  this.foo = new function() {};\n' +
  '  foo();\n' +
  '  var hello = () => console.log("hello")}\n' +
  '\n' +
  '@decorator()\n' +
  'class NameClass {\n' +
  '}\n' +
  'declare module name{\n' +
  '  declare export var exportedVar: string;\n' +
  '  declare export function exportedFunction(): void;\n' +
  '  declare export class ExportedClass {}\n' +
  '}\n' +
  'interface MyInterface { }\n' +
  'type FooBarAlias = string;\n' +
  "var html =`<div title='HTML injection'>Injected language fragment</div>`;\n" +
  'var x: MyInterface, y: string, z: FooBarAlias;\n' +
  'module ModuleValidator {\n' +
  '    import checkChars = CharUtils.notWhiteSpace;\n' +
  '    export interface HasValidator<T> {\n' +
  '        validateValue():Boolean;\n' +
  '    }\n' +
  '\n' +
  '    type FooBarAlias = string;\n' +
  '\n' +
  '    @decorator()\n' +
  '    class HasValidator implements HasValidator<String> {\n' +
  '        /* Processed values */\n' +
  '        static validatedValue:Array<String> = ["", "aa"];\n' +
  '        private myValue:String;\n' +
  '\n' +
  '        /**\n' +
  '         * Constructor for class\n' +
  '         * @param valueParameter Value for <i>validation</i>\n' +
  '         */\n' +
  '        constructor(valueParameter: String) {\n' +
  '            this.myValue = valueParameter;\n' +
  '            HasValidator.validatedValue.push(value);\n' +
  '        }\n' +
  '\n' +
  '        public validateValue():Boolean {\n' +
  '            var resultValue:Boolean = checkChars(this.myValue);\n' +
  '            return resultValue;\n' +
  '        }\n' +
  '\n' +
  '        static createInstance(valueParameter: string): HasValidator {\n' +
  '            return new HasValidator(valueParameter);\n' +
  '        }\n' +
  '    }\n' +
  '\n' +
  '    function globalFunction<TypeParameter>(value:TypeParameter) { //global function\n' +
  '        return 42;\n' +
  '    }\n' +
  '    declare var declareUrl;\n' +
  '    var hello = () => console.log("hello");\n' +
  '    HasValidator.createInstance(varUrl).validateValue();\n' +
  '    function acceptsUnion(s: string | number) {\n' +
  '       if (typeof s === "string") {\n' +
  '         s\n' +
  '       }\n' +
  '    }\n' +
  '    enum EnumName {\n' +
  '       EnumMember\n' +
  '    }}' +
  "import _ from 'lodash';\n" +
  "export declare interface MyInterface from './myClass';\n" +
  'export default MyClass;\n' +
  '\n' +
  'type MyFoo = MyInterface;\n' +
  'type Types = keyof typeof types;\n' +
  '\n' +
  'class MyType extends AbstractClass {\n' +
  '  private field: string;\n' +
  '  protected value: number;\n' +
  '  public num = 10;\n' +
  '\n' +
  '  static foo(): unknown {}\n' +
  '  get hello(): any {}\n' +
  '  set hello(v): void {}\n' +
  '\n' +
  '  method() {\n' +
  '    var x = 10;\n' +
  '    this.x = null;\n' +
  '    if (x === undefined) {\n' +
  "      console.log('foo');\n" +
  "      window.alert('foo');\n" +
  '      debugger;\n' +
  '      return false;\n' +
  '    }\n' +
  '    return true;\n' +
  '  }\n' +
  '\n' +
  '  async function promise() {\n' +
  '    try {\n' +
  '      const res = await myCall();\n' +
  '      yield 10;\n' +
  '    } catch (e as Error) {\n' +
  '      throw new Error("invalid");\n' +
  '    } finally {\n' +
  '      for (let elem of array) {\n' +
  '        if (elem instanceof SomeClass || elem typeof SomeClass) return false;\n' +
  '      }\n' +
  '    }\n' +
  '\n' +
  '    return true;\n' +
  '  }\n' +
  '}\n' +
  '\n' +
  'enum MyEnum {\n' +
  '  UP = 1,\n' +
  '  DOWN = 2\n' +
  '}\n' +
  '\n' +
  'export default SomeClass;\n' +
  'module.exports = foo;';

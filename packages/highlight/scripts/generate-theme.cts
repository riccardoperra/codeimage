import chalk from 'chalk';
import {prompt} from 'enquirer';
import {existsSync, mkdirSync, readdirSync, writeFileSync} from 'node:fs';
import {join} from 'path';
import prettier, {Options as PrettierOptions} from 'prettier';
import tsParser from 'prettier/parser-typescript';
import {
	NewLineKind,
	ObjectLiteralExpressionPropertyStructures,
	Project,
	ScriptTarget,
	SourceFile,
	StructureKind,
	SyntaxKind,
	VariableDeclarationKind,
} from 'ts-morph';

const log = console.log;

const project = new Project({
	tsConfigFilePath: join(__dirname, '../tsconfig.json'),
	compilerOptions: {
		target: ScriptTarget.ESNext,
	},
});

project.manipulationSettings.set({
	newLineKind: NewLineKind.LineFeed,
});

const themesPath = join(__dirname, '../src/lib/themes');

init();

async function init() {
	const prettierConfig = (await prettier.resolveConfig(
		join(__dirname, '../../../.prettierrc'),
	)) as PrettierOptions;

	const response = await prompt<{themeName: string}>({
		type: 'input',
		name: 'themeName',
		required: true,
		message: 'Insert the theme name (example: githubDark)',
	});

	const {themeName} = response;

	const themesPath = join(__dirname, '../src/lib/themes');

	if (existsSync(`${themesPath}/${themeName}`)) {
		log(chalk.red(`ERROR: Theme ${themeName} already exists`));
		return;
	}
	mkdirSync(join(themesPath, themeName));
	log(chalk.green(`Templates loaded successfully!`));

	await createThemeFile(themeName, prettierConfig);
	await createIndexFile(themeName, prettierConfig);
	await updateExportFile(prettierConfig);
	log(chalk.green(`Theme ${themeName} created successfully!`));
	log(chalk.cyan(`Output folder: ./src/lib/themes/${themeName}`));

	await import('../package.json').then(json => {
		const packageJson = {...json.default};
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(packageJson.exports as any)[`./${themeName}`] = {
			import: `./dist/lib/themes/${themeName}/index.js`,
			types: `./dist/lib/themes/${themeName}/index.d.ts`,
		};
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(packageJson.typesVersions as any)['*'][themeName] = [
			`./dist/lib/themes/${themeName}/index.d.ts`,
		];

		writeFileSync(
			join(__dirname, '../package.json'),
			JSON.stringify(packageJson, null, 2),
			{encoding: 'utf8'},
		);
	});
}

async function updateExportFile(prettierConfig: PrettierOptions) {
	const dirNames = readdirSync(themesPath, {withFileTypes: true})
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name);

	const source = project.createSourceFile(`${themesPath}/index.ts`, undefined, {
		overwrite: true,
	});

	dirNames.forEach(dir => {
		source.addExportDeclaration({
			moduleSpecifier: `./${dir}`,
		});
	});

	saveSource(source, prettierConfig);
}

async function createThemeFile(
	themeName: string,
	prettierConfig: PrettierOptions,
) {
	const source = project.createSourceFile(
		`${themesPath}/${themeName}/${themeName}.ts`,
		undefined,
		{overwrite: true},
	);

	const importDeclaration = source.addImportDeclaration({
		moduleSpecifier: '../../core',
	});

	importDeclaration.addNamedImport('defineEditorTheme');

	source.addVariableStatement({
		declarationKind: VariableDeclarationKind.Const,
		kind: StructureKind.VariableStatement,
		isExported: true,
		declarations: [
			{
				name: 'palette',
				initializer: '{}',
			},
		],
	});

	const paletteLiteral = source
		.getVariableDeclarationOrThrow('palette')
		.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);

	const palette = {
		foreground: '#0a0a0a',
		text: '#ffffff',
		text2: '#bebebe',
		punctuation: '#e3db2a',
		numbers: '#7dff97',
		strings: '#da4d4d',
		property: '#bea1ff',
		keywords: '#ff60c0',
		comments: '#A5A5A5',
		className: '#21d5b8',
		function: '#21d5b8',
	};

	paletteLiteral.addProperties(
		Object.entries(palette).map(
			([k, v]) =>
				({
					name: k,
					kind: StructureKind.PropertyAssignment,
					initializer: `'${v}'`,
				} as ObjectLiteralExpressionPropertyStructures),
		),
	);

	source.addVariableStatement({
		declarationKind: VariableDeclarationKind.Const,
		kind: StructureKind.VariableStatement,
		isExported: true,
		leadingTrivia: writer => writer.writeLine('\n'),
		declarations: [
			{
				name: themeName,
				initializer: '[]',
			},
		],
	});

	const themeArray = source
		.getVariableDeclarationOrThrow(themeName)
		.getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression);

	themeArray.addElement(
		writer => {
			writer.writeLine(
				'defineEditorTheme({\n' +
				'    highlight: {\n' +
				'      punctuation: palette.punctuation,\n' +
				'      delimiters: palette.punctuation,\n' +
				'      numbers: palette.numbers,\n' +
				'      strings: palette.strings,\n' +
				'      regexp: palette.strings,\n' +
				'      variableName: palette.property,\n' +
				'      keywords: palette.keywords,\n' +
				'      base: palette.text,\n' +
				'      tag: palette.text,\n' +
				'      comments: palette.comments,\n' +
				'      propertyName: palette.property,\n' +
				'      className: palette.className,\n' +
				'      function: palette.function,\n' +
				'    },\n' +
				'    selection: {},\n' +
				'    lineNumbers: {\n' +
				'      color: palette.text2,\n' +
				'    },\n' +
				'    cursor: {\n' +
				'      color: palette.text2,\n' +
				'    },\n' +
				'    autocomplete: {\n' +
				'      background: palette.text,\n' +
				'      border: palette.text2,\n' +
				'      selectedBackground: palette.strings,\n' +
				'    },\n' +
				'    darkMode: true,\n' +
				'  })',
			);
		},
		{useNewLines: true},
	);

	saveSource(source, prettierConfig);
}

async function createIndexFile(
	themeName: string,
	prettierConfig: PrettierOptions,
) {
	const source = project.createSourceFile(
		`${themesPath}/${themeName}/index.ts`,
		undefined,
		{overwrite: true},
	);

	source.addImportDeclarations([
		{
			moduleSpecifier: '../../core',
			namedImports: [{name: 'createTheme'}],
		},
		{
			moduleSpecifier: `./${themeName}`,
			namedImports: [{name: themeName}, {name: 'palette'}],
		},
	]);

	source.addVariableStatement({
		kind: StructureKind.VariableStatement,
		isExported: true,
		declarationKind: VariableDeclarationKind.Const,
		declarations: [
			{
				name: `${themeName}Theme`,
				initializer: writer =>
					writer.writeLine(
						'createTheme({\n' +
						`  id: '${themeName}',\n` +
						`  editorTheme: ${themeName},\n` +
						'  properties: {\n' +
						'    darkMode: true,\n' +
						`    label: '${themeName}',\n` +
						'    previewBackground: ``,\n' +
						'    terminal: {\n' +
						'      main: palette.foreground,\n' +
						'      text: palette.text,\n' +
						'    },\n' +
						'  },\n' +
						'} as const);',
					),
			},
		],
	});

	saveSource(source, prettierConfig);
}

function saveSource(source: SourceFile, prettierOptions: PrettierOptions) {
	source.saveSync();
	const formatted = prettierFormat(source.getText(), prettierOptions);
	writeFileSync(source.getFilePath(), formatted, {encoding: 'utf-8'});
}

function prettierFormat(source: string, options: PrettierOptions): string {
	return prettier.format(source, {
		...options,
		plugins: [tsParser],
		parser: 'typescript',
	});
}

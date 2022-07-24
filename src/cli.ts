#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { genCode } from './index';

const program = new Command();
const args = program

	.requiredOption(
		'-s, --src <url|path>',
		'The url or path to the Open API spec file',
		String,
		process.env.OPEN_API_SRC
	)
	.requiredOption(
		'-o, --outDir <dir>',
		'The path to the directory where files should be generated',
		process.env.OPEN_API_OUT
	)
	.requiredOption(
		'-l, --language <js|ts>',
		'The language of code to generate',
		process.env.OPEN_API_LANG
	)
	.option(
		'-k, --authKey <key>',
		'Auth Key passed in Open-Api-Spec-Auth-Key header',
		process.env.OPEN_API_AUTHKEY
	)
	.option(
		'--redux',
		'True if wanting to generate redux action creators',
		process.env.OPEN_API_REDUX
	)
	.option(
		'--semicolon',
		'True if wanting to use a semicolon statement terminator',
		process.env.OPEN_API_SEMICOLON
	)
	.option(
		'--indent <2|4|tab>',
		'Indentation to use, defaults to 2 spaces',
		process.env.OPEN_API_INDENT
	).option('--isolatedModules', 'True if wanting to isolated modules with ts', process.env.OPEN_API_MODULES)
	.parse(process.argv)
	.opts<ClientOptions>();

function onComplete() {
	console.info(
		chalk.bold.cyan(`Api ${args.src} code generated into ${args.outDir}`)
	);
	process.exit(0);
}

function onError(e: unknown) {
	if (e instanceof Error) {
		console.error(chalk.red(e.message), e.stack);
	} else {
		console.error(chalk.red(e));
	}
	process.exit(1);
}

genCode(args).then(onComplete, onError);

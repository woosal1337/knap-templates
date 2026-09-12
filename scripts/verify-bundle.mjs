import { readFileSync, statSync } from 'node:fs';

const file = 'main.js';
const source = readFileSync(file, 'utf8');
const size = statSync(file).size;
const errors = [];

const forbidden = [
	[/\brequire\(["'](?:fs|path|child_process|electron)["']\)/u, 'a desktop-only module'],
	[/\bnode:(?:fs|path|child_process)\b/u, 'a Node.js module'],
	[/\beval\s*\(/u, 'eval'],
	[/\bnew\s+Function\s*\(/u, 'a dynamic function'],
];

for (const [pattern, label] of forbidden) {
	if (pattern.test(source)) {
		errors.push(`The production bundle contains ${label}.`);
	}
}

if (size > 2_500_000) {
	errors.push(`The production bundle is ${size} bytes. Keep it at or below 2500000 bytes.`);
}

if (errors.length > 0) {
	for (const error of errors) {
		console.error(error);
	}
	process.exit(1);
}

console.log(`The production bundle is ${size} bytes and passes the runtime scan.`);

import { existsSync, readFileSync } from 'node:fs';

const packageData = JSON.parse(readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const versions = JSON.parse(readFileSync('versions.json', 'utf8'));

const errors = [];

if (!/^\d+\.\d+\.\d+$/u.test(manifest.version)) {
	errors.push('manifest.json must use an x.y.z version.');
}
if (packageData.version !== manifest.version) {
	errors.push('package.json and manifest.json must use the same version.');
}
if (versions[manifest.version] !== manifest.minAppVersion) {
	errors.push('versions.json must map the plugin version to minAppVersion.');
}
if (!/^[a-z0-9-]+$/u.test(manifest.id) || manifest.id.includes('obsidian')) {
	errors.push('The plugin ID must use lowercase letters, numbers, and hyphens without the word obsidian.');
}
if (!manifest.description.endsWith('.') || manifest.description.length > 250) {
	errors.push('The manifest description must end with a period and contain at most 250 characters.');
}
if (manifest.isDesktopOnly !== false) {
	errors.push('The manifest must keep desktop-only mode off.');
}

for (const file of ['LICENSE', 'README.md', 'main.js', 'manifest.json', 'styles.css']) {
	if (!existsSync(file)) {
		errors.push(`The required release file ${file} is missing.`);
	}
}

if (errors.length > 0) {
	for (const error of errors) {
		console.error(error);
	}
	process.exit(1);
}

console.log(`Release metadata is valid for ${manifest.id} ${manifest.version}.`);

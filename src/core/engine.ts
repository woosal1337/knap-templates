import {
	createEngine,
	standardFilters,
	type TemplateError,
	type TemplateResult,
	type TemplateVariables,
	type TemplateWarning,
} from 'knap';

const SAFE_LIMITS = {
	maxDepth: 100,
	maxOperations: 100_000,
	maxOutputLength: 2_000_000,
	maxTemplateLength: 500_000,
	maxValueLength: 2_000_000,
} as const;

const safeEngine = createEngine({
	allowRegex: false,
	filters: standardFilters,
	limits: SAFE_LIMITS,
});

const regexEngine = createEngine({
	allowRegex: true,
	filters: standardFilters,
	limits: SAFE_LIMITS,
});

function engineFor(allowRegex: boolean) {
	return allowRegex ? regexEngine : safeEngine;
}

export function validateKnapTemplate(
	template: string,
	allowRegex = false,
): TemplateError[] {
	return engineFor(allowRegex).validate(template);
}

export async function renderKnapTemplate(
	template: string,
	variables: TemplateVariables,
	allowRegex = false,
): Promise<TemplateResult> {
	return await engineFor(allowRegex).render(template, { variables });
}

export function formatTemplateError(error: TemplateError): string {
	return `Line ${error.line}, column ${error.column}: ${error.message}`;
}

export function formatTemplateWarning(warning: TemplateWarning): string {
	return `Line ${warning.line}, column ${warning.column}: ${warning.message}`;
}

import type { DisclosureOptions as Options } from './types';

export function resolveOptions(defaults: Options, source: Partial<Options>): Options {
  const merged = { ...defaults, ...source };

  if (typeof merged.collapsible !== 'boolean') {
    const collapsible = defaults.collapsible;
    console.warn(`Invalid collapsible option. Fallback: ${collapsible}.`);
    merged.collapsible = collapsible;
  }

  return merged;
}

import { restoreAttributes, saveAttributes } from '@y14e/attribute-utils';
import { createRovingTabIndex } from '@y14e/roving-tabindex';
import { defaults } from './defaults';
import { resolveOptions } from './options';
import type { Binding, DisclosureOptions as Options } from './types';

export class Disclosure {
  static defaults: Partial<Options> = {};

  #element!: HTMLElement;
  #settings!: Options;
  #detailsElements!: HTMLDetailsElement[];
  #summaryElements!: HTMLElement[];
  #contentElements!: HTMLElement[];
  #bindings = new WeakMap<HTMLElement, Binding>();
  #controller: AbortController | null = null;
  #cleanupRovingTabIndex: (() => void) | null = null;
  #isDestroyed = false;

  constructor(element: HTMLElement, options: Partial<Options> = {}) {
    if (!(element instanceof HTMLElement)) {
      throw new TypeError('Invalid element');
    }

    if (element.hasAttribute('data-disclosure-initialized')) {
      console.warn('Already initialized');
      return;
    }

    this.#element = element;
    this.#settings = resolveOptions(resolveOptions(defaults, Disclosure.defaults), options);
    const NOT_NESTED = ':not(:scope summary + * *)';
    this.#detailsElements = [
      ...this.#element.querySelectorAll<HTMLDetailsElement>(`details${NOT_NESTED}`),
    ];

    if (!this.#detailsElements.length) {
      console.warn('Missing <details> elements');
      return;
    }

    this.#summaryElements = [
      ...this.#element.querySelectorAll<HTMLElement>(`summary${NOT_NESTED}`),
    ];

    if (!this.#summaryElements.length) {
      console.warn('Missing <summary> elements');
      return;
    }

    this.#contentElements = [
      ...this.#element.querySelectorAll<HTMLElement>(`summary${NOT_NESTED} + *`),
    ];

    if (!this.#contentElements.length) {
      console.warn('Missing content elements');
      return;
    }

    this.#detailsElements.forEach((details, i) => {
      const summary = this.#summaryElements[i];
      const content = this.#contentElements[i];

      if (!summary || !content) {
        return;
      }

      const binding = this.#createBinding(details, summary, content);

      [details, summary, content].forEach((element) => {
        this.#bindings.set(element, binding);
      });
    });

    this.#initialize();
  }

  close(details: HTMLDetailsElement): void {
    if (this.#isDestroyed) {
      return;
    }

    if (!this.#isValidDetails(details)) {
      console.warn('Invalid <details> element');
      return;
    }

    this.#toggle(details, false);
  }

  destroy(): void {
    if (this.#isDestroyed) {
      return;
    }

    this.#isDestroyed = true;
    this.#controller?.abort();
    this.#controller = null;
    this.#cleanupRovingTabIndex?.();
    this.#cleanupRovingTabIndex = null;
    this.#detailsElements.length = 0;
    restoreAttributes(this.#summaryElements);
    this.#summaryElements.length = 0;
    this.#contentElements.length = 0;
    this.#element.removeAttribute('data-disclosure-initialized');
  }

  open(details: HTMLDetailsElement): void {
    if (this.#isDestroyed) {
      return;
    }

    if (!this.#isValidDetails(details)) {
      console.warn('Invalid <details> element');
      return;
    }

    this.#toggle(details, true);
  }

  #initialize(): void {
    saveAttributes(this.#summaryElements, ['aria-disabled', 'style', 'tabindex']);
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    for (const summary of this.#summaryElements) {
      if (!this.#isFocusable(summary)) {
        summary.setAttribute('aria-disabled', 'true');
        summary.setAttribute('tabindex', '-1');
        summary.style.setProperty('pointer-events', 'none');
      }

      summary.addEventListener('click', this.#onSummaryClick, { signal });
    }

    this.#cleanupRovingTabIndex = createRovingTabIndex(this.#element, {
      direction: 'vertical',
      navigationOnly: true,
      selector: 'summary:not(:scope summary + * *)',
      wrap: true,
    });

    this.#element.setAttribute('data-disclosure-initialized', '');
  }

  #onSummaryClick = (event: MouseEvent): void => {
    event.preventDefault();
    const summary = event.currentTarget;

    if (!(summary instanceof HTMLElement)) {
      return;
    }

    const details = this.#bindings.get(summary)?.details;
    details && this.#toggle(details, !details.open);
  };

  #toggle(details: HTMLDetailsElement, isOpen: boolean): void {
    if (details.open === isOpen) {
      return;
    }

    if (
      !isOpen &&
      !this.#settings.collapsible &&
      this.#detailsElements.filter((d) => d.open).length <= 1
    ) {
      return;
    }

    details.open = isOpen;
  }

  #createBinding(details: HTMLDetailsElement, summary: HTMLElement, content: HTMLElement): Binding {
    return { content, details, summary };
  }

  #isFocusable(element: HTMLElement): boolean {
    return element.tabIndex >= 0;
  }

  #isValidDetails(details: HTMLDetailsElement): boolean {
    return details instanceof HTMLDetailsElement && this.#bindings.has(details);
  }
}

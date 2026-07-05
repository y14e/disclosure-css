/**
 * Disclosure (CSS Animation)
 * WAI-ARIA compliant disclosure pattern implementation in TypeScript.
 * Using the <details> and <summary> element.
 *
 * @version 2.0.1
 * @author Yusuke Kamiyamane
 * @license MIT
 * @copyright Copyright (c) Yusuke Kamiyamane
 * @see {@link https://github.com/y14e/disclosure-css}
 */

// -----------------------------------------------------------------------------
// import
// -----------------------------------------------------------------------------

import { restoreAttributes, saveAttributes } from '@y14e/attributes-utils';
import { createRovingTabIndex } from '@y14e/roving-tabindex';
import type { DeepRequired } from 'utility-types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface DisclosureOptions {
  readonly collapsible?: boolean;
}

type Binding = {
  details: HTMLDetailsElement;
  summary: HTMLElement;
  content: HTMLElement;
};

// -----------------------------------------------------------------------------
// APIs
// -----------------------------------------------------------------------------

export default class Disclosure {
  static defaults: DisclosureOptions = {};

  #rootElement!: HTMLElement;
  #defaults = { collapsible: true };
  #settings!: DeepRequired<DisclosureOptions>;
  #detailsElements!: HTMLDetailsElement[];
  #summaryElements!: HTMLElement[];
  #contentElements!: HTMLElement[];
  #bindings = new WeakMap<HTMLElement, Binding>();
  #controller: AbortController | null = null;
  #cleanupRovingTabIndex: (() => void) | null = null;
  #isDestroyed = false;

  constructor(root: HTMLElement, options: DisclosureOptions = {}) {
    if (!(root instanceof HTMLElement)) {
      throw new TypeError('Invalid root element');
    }

    if (root.hasAttribute('data-disclosure-initialized')) {
      console.warn('Already initialized');
      return;
    }

    this.#rootElement = root;
    this.#defaults = this.#mergeOptions(this.#defaults, Disclosure.defaults);
    this.#settings = this.#mergeOptions(this.#defaults, options);
    const NOT_NESTED = ':not(:scope summary + * *)';
    this.#detailsElements = [
      ...this.#rootElement.querySelectorAll<HTMLDetailsElement>(
        `details${NOT_NESTED}`,
      ),
    ];

    if (!this.#detailsElements.length) {
      console.warn('Missing <details> elements');
      return;
    }

    this.#summaryElements = [
      ...this.#rootElement.querySelectorAll<HTMLElement>(
        `summary${NOT_NESTED}`,
      ),
    ];

    if (!this.#summaryElements.length) {
      console.warn('Missing <summary> elements');
      return;
    }

    this.#contentElements = [
      ...this.#rootElement.querySelectorAll<HTMLElement>(
        `summary${NOT_NESTED} + *`,
      ),
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
      this.#bindings.set(details, binding);
      this.#bindings.set(summary, binding);
      this.#bindings.set(content, binding);
    });

    this.#initialize();
  }

  collapse(details: HTMLDetailsElement): void {
    if (this.#isDestroyed) {
      return;
    }

    if (
      !(details instanceof HTMLDetailsElement) ||
      !this.#bindings.has(details)
    ) {
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
    this.#rootElement.removeAttribute('data-disclosure-initialized');
  }

  expand(details: HTMLDetailsElement): void {
    if (this.#isDestroyed) {
      return;
    }

    if (
      !(details instanceof HTMLDetailsElement) ||
      !this.#bindings.has(details)
    ) {
      console.warn('Invalid <details> element');
      return;
    }

    this.#toggle(details, true);
  }

  #initialize(): void {
    saveAttributes(this.#summaryElements, [
      'aria-disabled',
      'style',
      'tabindex',
    ]);
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    this.#summaryElements.forEach((summary) => {
      if (!this.#isFocusable(summary)) {
        summary.setAttribute('aria-disabled', 'true');
        summary.setAttribute('tabindex', '-1');
        summary.style.setProperty('pointer-events', 'none');
      }

      summary.addEventListener('click', this.#onSummaryClick, { signal });
    });

    this.#cleanupRovingTabIndex = createRovingTabIndex(this.#rootElement, {
      direction: 'vertical',
      navigationOnly: true,
      selector: 'summary:not(:scope summary + * *)',
      wrap: true,
    });

    this.#rootElement.setAttribute('data-disclosure-initialized', '');
  }

  #onSummaryClick = (event: MouseEvent): void => {
    event.preventDefault();
    const summary = event.currentTarget;

    if (!(summary instanceof HTMLElement)) {
      return;
    }

    const binding = this.#bindings.get(summary);

    if (!binding) {
      return;
    }

    const { details } = binding;
    this.#toggle(details, !details.open);
  };

  #toggle(details: HTMLDetailsElement, isExpand: boolean): void {
    if (details.open === isExpand) {
      return;
    }

    if (
      !isExpand &&
      !this.#settings.collapsible &&
      this.#detailsElements.filter((details) => details.open).length <= 1
    ) {
      return;
    }

    details.open = isExpand;
  }

  #createBinding(
    details: HTMLDetailsElement,
    summary: HTMLElement,
    content: HTMLElement,
  ): Binding {
    return { details, summary, content };
  }

  #isFocusable(element: HTMLElement): boolean {
    return element.tabIndex >= 0;
  }

  #mergeOptions(
    target: DeepRequired<DisclosureOptions>,
    source: DisclosureOptions,
  ): DeepRequired<DisclosureOptions> {
    return { ...target, ...source };
  }
}

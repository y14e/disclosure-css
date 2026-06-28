/**
 * Disclosure (CSS Animation)
 * WAI-ARIA compliant disclosure pattern implementation in TypeScript.
 * Using the <details> and <summary> element.
 *
 * @version 1.3.13
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

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type Binding = {
  details: HTMLDetailsElement;
  summary: HTMLElement;
  content: HTMLElement;
};

// -----------------------------------------------------------------------------
// APIs
// -----------------------------------------------------------------------------

export default class Disclosure {
  #rootElement!: HTMLElement;
  #detailsElements!: HTMLDetailsElement[];
  #summaryElements!: HTMLElement[];
  #contentElements!: HTMLElement[];
  #bindings = new WeakMap<HTMLElement, Binding>();
  #cleanupRovingTabIndex: (() => void) | null = null;
  #isDestroyed = false;

  constructor(root: HTMLElement) {
    if (!(root instanceof HTMLElement)) {
      throw new TypeError('Invalid root element');
    }

    if (root.hasAttribute('data-disclosure-initialized')) {
      console.warn('Already initialized');
      return;
    }

    this.#rootElement = root;
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

  close(details: HTMLDetailsElement): void {
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
    this.#cleanupRovingTabIndex?.();
    this.#cleanupRovingTabIndex = null;
    this.#detailsElements.length = 0;
    restoreAttributes(this.#summaryElements);
    this.#summaryElements.length = 0;
    this.#contentElements.length = 0;
    this.#rootElement.removeAttribute('data-disclosure-initialized');
  }

  open(details: HTMLDetailsElement): void {
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

    this.#summaryElements
      .filter((summary) => !this.#isFocusable(summary))
      .forEach((summary) => {
        summary.setAttribute('aria-disabled', 'true');
        summary.setAttribute('tabindex', '-1');
        summary.style.setProperty('pointer-events', 'none');
      });

    this.#cleanupRovingTabIndex = createRovingTabIndex(this.#rootElement, {
      direction: 'vertical',
      navigationOnly: true,
      selector: 'summary:not(:scope summary + * *)',
      wrap: true,
    });

    this.#rootElement.setAttribute('data-disclosure-initialized', '');
  }

  #toggle(details: HTMLDetailsElement, isOpen: boolean): void {
    if (details.open !== isOpen) {
      details.open = isOpen;
    }
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
}

/**
 * Disclosure (CSS Animation)
 * WAI-ARIA compliant disclosure pattern implementation in TypeScript.
 * Using the <details> and <summary> element.
 *
 * @version 1.2.5
 * @author Yusuke Kamiyamane
 * @license MIT
 * @copyright Copyright (c) Yusuke Kamiyamane
 * @see {@link https://github.com/y14e/disclosure-css}
 */

// -----------------------------------------------------------------------------
// import
// -----------------------------------------------------------------------------

import { restoreAttributes, saveAttributes } from '@y14e/attributes-utils';

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
  #controller: AbortController | null = null;
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

      const binding = createBinding(details, summary, content);
      this.#bindings.set(details, binding);
      this.#bindings.set(summary, binding);
      this.#bindings.set(content, binding);
    });

    this.#initialize();
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
    this.#controller?.abort();
    this.#controller = null;
    this.#detailsElements.length = 0;
    restoreAttributes(this.#summaryElements);
    this.#summaryElements.length = 0;
    this.#contentElements.length = 0;
    this.#rootElement.removeAttribute('data-disclosure-initialized');
  }

  #initialize(): void {
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    this.#summaryElements.forEach((summary) => {
      if (!summary) {
        return;
      }

      if (!isFocusable(summary)) {
        saveAttributes([summary], ['aria-disabled', 'style', 'tabindex']);
        summary.setAttribute('aria-disabled', 'true');
        summary.setAttribute('tabindex', '-1');
        summary.style.setProperty('pointer-events', 'none');
      }

      summary.addEventListener('keydown', this.#onSummaryKeyDown, { signal });
    });

    this.#rootElement.setAttribute('data-disclosure-initialized', '');
  }

  #onSummaryKeyDown = (event: KeyboardEvent) => {
    const { key } = event;

    if (!['End', 'Home', 'ArrowUp', 'ArrowDown'].includes(key)) {
      return;
    }

    const focusables = this.#summaryElements.filter(isFocusable);
    const active = getActiveElement();

    if (!(active instanceof HTMLElement)) {
      return;
    }

    event.preventDefault();
    const currentIndex = focusables.indexOf(active);
    let newIndex = currentIndex;

    switch (key) {
      case 'End':
        newIndex = -1;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'ArrowUp':
        newIndex = currentIndex - 1;
        break;
      case 'ArrowDown':
        newIndex = (currentIndex + 1) % focusables.length;
        break;
    }

    focusables.at(newIndex)?.focus();
  };

  #toggle(details: HTMLDetailsElement, isOpen: boolean): void {
    if (details.open !== isOpen) {
      details.open = isOpen;
    }
  }
}

// -----------------------------------------------------------------------------
// Utils
// -----------------------------------------------------------------------------

function createBinding(
  details: HTMLDetailsElement,
  summary: HTMLElement,
  content: HTMLElement,
): Binding {
  return { details, summary, content };
}

function getActiveElement(): Element | null {
  let current = document.activeElement;

  while (current?.shadowRoot?.activeElement) {
    current = current.shadowRoot.activeElement;
  }

  return current;
}

function isFocusable(element: HTMLElement): boolean {
  return element.tabIndex >= 0;
}

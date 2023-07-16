import { getSelectorOfElement } from './getSelectorOfElement';

/**
 * defines a description of a dom element that can be used to easily identify the element in app-usage-events
 */
export const getDescriptionOfElement = (element: Element) => {
  return {
    identity: element.id ?? undefined,
    text:
      element.textContent && element.textContent.length < 30 // 30 to exclude, for example, all text if someone clicks on the root div
        ? element.textContent
        : undefined,
    selector: getSelectorOfElement(element),
  };
};

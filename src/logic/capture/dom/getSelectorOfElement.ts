import { UnexpectedCodePathError } from '../../../utils/errors/UnexpectedCodePathError';

/**
 * recursively walks up the parent chain to define a unique selector for an element
 *
 * ref
 * - https://stackoverflow.com/questions/42184322/javascript-get-element-unique-selector
 */
export const getSelectorOfElement = (element: Element): string => {
  // if we're at the root node, terminate
  if (element.tagName.toLowerCase() == 'html') return 'html';

  // define based on tagname
  let str = element.tagName.toLowerCase();

  // add id if exists
  str += element.id != '' ? '#' + element.id : '';

  // add classes if exist
  if (element.className) {
    const classes = element.className.trim().split(/\s+/);
    for (const thisClass of classes) str += '.' + thisClass;
  }

  // add sibling qualifier if has siblings
  let childIndex = 1;
  for (
    let e = element;
    e.previousElementSibling;
    e = e.previousElementSibling
  ) {
    childIndex += 1;
  }
  str += childIndex > 0 ? `:nth-child(${childIndex})` : '';

  // walk up the chain
  if (!element.parentElement)
    throw new UnexpectedCodePathError(
      'detected an element without a parent and it wasnt the HTML node',
      { str },
    );
  return getSelectorOfElement(element.parentElement) + ' > ' + str;
};

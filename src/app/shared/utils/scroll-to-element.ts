/**
 * Scrolls the page smoothly to the element with the specified ID.
 *
 * @param {string} elementId - The ID of the element to scroll to.
 * @param {Document} _document - (Optional) The Document object to use for querying
 * the element. Defaults to the global document object if not provided.
 */
export function scrollToElementId(elementId: string, _document?: Document) {
  const dom = _document || document;

  const el = dom.getElementById(elementId);

  if (el) el.scrollIntoView({ behavior: "smooth", block: 'center' });
}
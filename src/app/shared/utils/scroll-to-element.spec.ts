import { scrollToElementId } from './scroll-to-element';

describe('scrollToElementId', () => {
  function documentWith(element: HTMLElement | null) {
    return { getElementById: () => element } as unknown as Document;
  }

  it('should bring the top of the element into view, so a tall course still shows its title', () => {
    const element = document.createElement('div');
    const scrollIntoView = spyOn(element, 'scrollIntoView');

    scrollToElementId('course', documentWith(element));

    expect(scrollIntoView).toHaveBeenCalledOnceWith(jasmine.objectContaining({ block: 'start' }));
  });

  it('should do nothing for an element that is not on the page', () => {
    expect(() => scrollToElementId('missing', documentWith(null))).not.toThrow();
  });
});

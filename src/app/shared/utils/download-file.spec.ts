import { downloadFile } from './download-file';

describe('downloadFile', () => {
  let createObjectURL: jasmine.Spy<typeof URL.createObjectURL>;
  let revokeObjectURL: jasmine.Spy<typeof URL.revokeObjectURL>;
  let clicked: HTMLAnchorElement[];

  beforeEach(() => {
    jasmine.clock().install();
    createObjectURL = spyOn(URL, 'createObjectURL').and.returnValue('blob:file');
    revokeObjectURL = spyOn(URL, 'revokeObjectURL');
    clicked = [];
    spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
      clicked.push(this);
    });
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should save the text under the given name', async () => {
    downloadFile(document, 'Spring.ics', 'text/calendar', 'BEGIN:VCALENDAR');

    const blob = createObjectURL.calls.mostRecent().args[0] as Blob;

    expect(clicked.length).toBe(1);
    expect(clicked[0].download).toBe('Spring.ics');
    expect(clicked[0].href).toBe('blob:file');
    expect(blob.type).toBe('text/calendar');
    expect(await blob.text()).toBe('BEGIN:VCALENDAR');
  });

  it('should keep the file available long enough for a slow browser to start saving it', () => {
    downloadFile(document, 'Spring.ics', 'text/calendar', 'BEGIN:VCALENDAR');

    expect(revokeObjectURL).not.toHaveBeenCalled();

    jasmine.clock().tick(40_000);

    expect(revokeObjectURL).toHaveBeenCalledOnceWith('blob:file');
  });
});

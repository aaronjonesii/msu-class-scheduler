import { TimePipe } from './time.pipe';
import { DatePipe } from "@angular/common";

describe('TimePipe', () => {
  it('create an instance', () => {
    const pipe = new TimePipe(new DatePipe(''));
    expect(pipe).toBeTruthy();
  });
});

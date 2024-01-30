import { RunningAveragePipe } from './running-average.pipe';

describe('RunningAveragePipe', () => {
  it('create an instance', () => {
    const pipe = new RunningAveragePipe();
    expect(pipe).toBeTruthy();
  });
});

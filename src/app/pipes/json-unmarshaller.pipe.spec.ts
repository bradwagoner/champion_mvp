import { JsonUnmarshallerPipe } from './json-unmarshaller.pipe';

describe('JsonUnmarshallerPipe', () => {
  it('create an instance', () => {
    const pipe = new JsonUnmarshallerPipe();
    expect(pipe).toBeTruthy();
  });
});

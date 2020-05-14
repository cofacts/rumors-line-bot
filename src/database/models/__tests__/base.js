import Base from '../base';

describe('base', () => {
  it('should get error when using Base.collection', async () => {
    expect(() => {
      return Base.collection;
    }).toThrowError('not yet implement');
  });
});

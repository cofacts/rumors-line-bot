import Client from '../../mongoClient';
import AppVariable from '../appVariable';

describe('appVariable', () => {
  beforeAll(async () => {
    if (await AppVariable.collectionExists()) {
      await (await AppVariable.client).drop();
    }
  });

  afterAll(async () => {
    await (await Client.getInstance()).close();
  });

  it('[schema] should pass', async () => {
    const data = {
      _id: 'foo',
      value: 'some string',
    };
    const { valid } = AppVariable.validator(data);
    expect(valid).toBe(true);
  });

  it('[model] sets valid value to DB', async () => {
    await AppVariable.set('foo', 123456);

    const data = (await AppVariable.find({ _id: 'foo' }))[0];
    expect(data).toMatchSnapshot();

    const { valid } = AppVariable.validator(data);
    expect(valid).toBe(true);
  });

  it('[model] gets undefined for variables not set yet', async () => {
    const value = await AppVariable.get('notExist');
    expect(value).toBe(undefined);
  });

  it('[model] gets setted primitive and objects', async () => {
    await AppVariable.set('num', 123456);
    expect(await AppVariable.get('num')).toBe(123456);

    await AppVariable.set('null', null);
    expect(await AppVariable.get('null')).toBe(null);

    await AppVariable.set('str', '123');
    expect(await AppVariable.get('str')).toBe('123');

    await AppVariable.set('obj', { foo: 123 });
    expect(await AppVariable.get('obj')).toEqual({ foo: 123 });
  });
});

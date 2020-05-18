import { sign, verify, read } from '../jwt';

it('signs, verifies and reads JWT', () => {
  const data = { foo: 'bar' };
  const jwt = sign(data);
  expect(jwt).toMatchInlineSnapshot(
    `"eyJhbGciOiJIUzI1NiJ9.eyJmb28iOiJiYXIifQ.oB-hPP-iM8gpHyhhTnltlh9Ph8WdapCcPRZ2zJ_AwBs"`
  );

  expect(verify(jwt)).toBe(true);

  expect(read(jwt)).toEqual(data);
});

it('verifies exp claim', () => {
  const dataNotExpired = { exp: Date.now() / 1000 + 86400 };
  const dataExpired = { exp: Date.now() / 1000 - 86400 };

  expect(verify(sign(dataNotExpired))).toBe(true);
  expect(verify(sign(dataExpired))).toBe(false);
});

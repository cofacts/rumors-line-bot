import { KJUR, b64utoutf8 } from 'jsrsasign';

const alg = 'HS256';
const sharedSecret = process.env.JWT_SECRET || 'secret';

export function sign(data) {
  return KJUR.jws.JWS.sign(null, { alg }, data, { utf8: sharedSecret });
}

export function verify(jwt) {
  return KJUR.jws.JWS.verifyJWT(jwt, { utf8: sharedSecret }, { alg: [alg] });
}

export function read(jwt) {
  return KJUR.jws.JWS.readSafeJSONString(b64utoutf8(jwt.split('.')[1]));
}

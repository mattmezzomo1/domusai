import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  formatDateOfBirth,
  hashPhone,
  normalizeEmail,
  normalizeNameParts,
  normalizePhone,
} from '../src/utils/meta.util';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

assert.equal(normalizeEmail('  Test@Example.COM  '), 'test@example.com');
assert.equal(normalizePhone('+55 (41) 99689-8529', 'BR'), '5541996898529');
assert.equal(normalizePhone('(41) 99689-8529', 'BR'), '5541996898529');
assert.equal(normalizePhone('(201) 555-0123', 'US'), '12015550123');
assert.equal(normalizePhone('(41) 99689-8529', 'US'), null);
assert.equal(hashPhone('(41) 99689-8529', 'BR'), sha256('5541996898529'));
assert.deepEqual(normalizeNameParts('  Maria da Silva  '), {
  firstName: 'maria',
  lastName: 'da silva',
});
assert.deepEqual(normalizeNameParts('Prince'), {
  firstName: 'prince',
  lastName: null,
});
assert.equal(formatDateOfBirth('1990-02-03'), '19900203');

console.log('meta.util tests passed');

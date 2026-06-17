import assert from "node:assert/strict";
import {
  formatPhoneNationalInput,
  getPhoneCountries,
  getPhonePlaceholder,
  normalizePhoneForCountry,
} from "./phone-utils.js";

const br = normalizePhoneForCountry("+55 (41) 99689-8529", "BR");
assert.equal(br.isValid, true);
assert.equal(br.digits, "5541996898529");

const brLocal = normalizePhoneForCountry("(41) 99689-8529", "BR");
assert.equal(brLocal.isValid, true);
assert.equal(brLocal.digits, "5541996898529");

const us = normalizePhoneForCountry("(201) 555-0123", "US");
assert.equal(us.isValid, true);
assert.equal(us.digits, "12015550123");

const mismatched = normalizePhoneForCountry("(41) 99689-8529", "US");
assert.equal(mismatched.isValid, false);

assert.equal(formatPhoneNationalInput("41996898529", "BR"), "(41) 99689-8529");
assert.equal(formatPhoneNationalInput("2015550123", "US"), "(201) 555-0123");
assert.equal(getPhonePlaceholder("BR"), "+55 (11) 96123-4567");
assert.equal(getPhonePlaceholder("US"), "+1 (201) 555-0123");
assert.ok(getPhoneCountries().some((country) => country.iso === "BR" && country.name === "Brazil"));

console.log("phone-utils tests passed");

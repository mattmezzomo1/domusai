import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  isSupportedCountry,
  parsePhoneNumberFromString,
} from "libphonenumber-js/max";
import examples from "libphonenumber-js/mobile/examples";

export const DEFAULT_PHONE_COUNTRY = "BR";

let countryDisplayNames = null;

try {
  countryDisplayNames = new Intl.DisplayNames(["en"], { type: "region" });
} catch {
  countryDisplayNames = null;
}

export function resolvePhoneCountry(countryIso) {
  const candidate = String(countryIso || DEFAULT_PHONE_COUNTRY).trim().toUpperCase();
  return isSupportedCountry(candidate) ? candidate : DEFAULT_PHONE_COUNTRY;
}

export function getCountryName(countryIso) {
  const country = resolvePhoneCountry(countryIso);
  return countryDisplayNames?.of(country) || country;
}

export function getFlagEmoji(countryIso) {
  const country = resolvePhoneCountry(countryIso);
  return String.fromCodePoint(
    ...country.split("").map((char) => 127397 + char.charCodeAt(0))
  );
}

export function getPhoneCountries() {
  return getCountries()
    .map((country) => ({
      iso: country,
      name: getCountryName(country),
      callingCode: getCountryCallingCode(country),
      flag: getFlagEmoji(country),
    }))
    .sort((a, b) => {
      if (a.iso === DEFAULT_PHONE_COUNTRY) return -1;
      if (b.iso === DEFAULT_PHONE_COUNTRY) return 1;
      return a.name.localeCompare(b.name);
    });
}

export function getPhoneCallingCode(countryIso) {
  return getCountryCallingCode(resolvePhoneCountry(countryIso));
}

export function formatPhoneNationalInput(value, countryIso = DEFAULT_PHONE_COUNTRY) {
  const country = resolvePhoneCountry(countryIso);
  const raw = String(value || "").trim();
  if (!raw) return "";

  const normalized = normalizePhoneForCountry(raw, country);
  if (normalized.isValid) {
    return new AsYouType(country).input(normalized.nationalNumber);
  }

  const parsed = raw.startsWith("+") ? parsePhoneNumberFromString(raw) : null;
  const valueToFormat = parsed?.country === country
    ? parsed.nationalNumber
    : raw.replace(/\D/g, "");

  return new AsYouType(country).input(valueToFormat);
}

export function getPhonePlaceholder(countryIso = DEFAULT_PHONE_COUNTRY) {
  const country = resolvePhoneCountry(countryIso);

  if (country === "BR") return "+55 (11) 96123-4567";
  if (country === "US") return "+1 (201) 555-0123";

  const example = getExampleNumber(country, examples);
  return example?.formatInternational() || `+${getCountryCallingCode(country)}`;
}

export function normalizePhoneForCountry(value, countryIso = DEFAULT_PHONE_COUNTRY) {
  const country = resolvePhoneCountry(countryIso);
  const raw = String(value || "").trim();

  if (!raw) {
    return {
      isValid: false,
      countryIso: country,
      digits: "",
      e164: "",
      nationalNumber: "",
      international: "",
    };
  }

  const parsed = raw.startsWith("+")
    ? parsePhoneNumberFromString(raw)
    : parsePhoneNumberFromString(raw, country);

  if (!parsed || (parsed.country && parsed.country !== country) || !parsed.isValid()) {
    return {
      isValid: false,
      countryIso: country,
      digits: raw.replace(/\D/g, ""),
      e164: "",
      nationalNumber: "",
      international: "",
    };
  }

  return {
    isValid: true,
    countryIso: parsed.country || country,
    digits: parsed.number.replace(/\D/g, ""),
    e164: parsed.number,
    nationalNumber: parsed.nationalNumber,
    international: parsed.formatInternational(),
  };
}

export function formatInternationalPhoneDisplay(value, countryIso = DEFAULT_PHONE_COUNTRY) {
  const normalized = normalizePhoneForCountry(value, countryIso);
  if (normalized.isValid) return normalized.international;

  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.startsWith("+") ? raw : `+${raw.replace(/\D/g, "")}`;
}

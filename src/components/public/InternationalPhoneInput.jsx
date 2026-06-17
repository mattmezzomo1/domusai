// @ts-nocheck
import React, { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  formatPhoneNationalInput,
  getPhoneCallingCode,
  getPhoneCountries,
  getPhonePlaceholder,
  normalizePhoneForCountry,
  resolvePhoneCountry,
} from "@/lib/phone-utils";

export default function InternationalPhoneInput({
  value,
  countryIso = "BR",
  onChange,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const countries = useMemo(() => getPhoneCountries(), []);
  const selectedIso = resolvePhoneCountry(countryIso);
  const selectedCountry = countries.find((country) => country.iso === selectedIso) || countries[0];

  const emitChange = (nextValue, nextCountryIso) => {
    const nextIso = resolvePhoneCountry(nextCountryIso);
    const inputValue = formatPhoneNationalInput(nextValue, nextIso);
    const normalized = normalizePhoneForCountry(inputValue, nextIso);

    onChange({
      inputValue,
      countryIso: nextIso,
      callingCode: getPhoneCallingCode(nextIso),
      normalizedPhone: normalized.isValid ? normalized.digits : "",
      nationalNumber: normalized.nationalNumber,
      isValid: normalized.isValid,
      international: normalized.international,
    });
  };

  const handleCountrySelect = (nextCountryIso) => {
    setOpen(false);
    emitChange(value, nextCountryIso);
  };

  return (
    <div className="flex w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="h-auto w-[138px] sm:w-[166px] justify-between rounded-r-none border-white/10 bg-[rgba(255,255,255,0.05)] px-3 py-4 text-white hover:bg-[rgba(255,255,255,0.08)] hover:text-white focus:border-[#C47B3C]"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="text-base leading-none">{selectedCountry.flag}</span>
              <span className="font-medium">{selectedCountry.iso}</span>
              <span className="text-[#AAAAAA]">+{selectedCountry.callingCode}</span>
            </span>
            <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 text-[#888888]" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[min(380px,calc(100vw-2rem))] border-white/10 bg-[#181818] p-0 text-white"
        >
          <Command className="bg-[#181818] text-white">
            <CommandInput
              placeholder="Search country..."
              className="text-white placeholder:text-[#888888]"
            />
            <CommandList>
              <CommandEmpty className="py-6 text-center text-sm text-[#AAAAAA]">
                No country found.
              </CommandEmpty>
              <CommandGroup>
                {countries.map((country) => (
                  <CommandItem
                    key={country.iso}
                    value={`${country.name} ${country.iso} ${country.callingCode}`}
                    onSelect={() => handleCountrySelect(country.iso)}
                    className="cursor-pointer text-white data-[selected=true]:bg-[#C47B3C]/20 data-[selected=true]:text-white"
                  >
                    <span className="text-lg leading-none">{country.flag}</span>
                    <span className="min-w-0 flex-1 truncate">{country.name}</span>
                    <span className="text-[#AAAAAA]">+{country.callingCode}</span>
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selectedIso === country.iso ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <input
        type="tel"
        value={value}
        onChange={(event) => emitChange(event.target.value, selectedIso)}
        placeholder={getPhonePlaceholder(selectedIso)}
        disabled={disabled}
        className="min-w-0 flex-1 rounded-l-none rounded-r-lg border border-l-0 border-white/10 bg-[rgba(255,255,255,0.05)] p-4 text-white placeholder-[#888888] transition-all focus:border-[#C47B3C] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}

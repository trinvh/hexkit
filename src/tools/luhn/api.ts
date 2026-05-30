import { runAction } from "../../lib/ipc";

export interface LuhnReport {
  digits: string;
  valid: boolean;
  checksumMod10: number;
  expectedCheckDigit: number;
  providedCheckDigit: number;
  corrected: string;
}

interface RawReport {
  digits: string;
  valid: boolean;
  checksum_mod_10: number;
  expected_check_digit: number;
  provided_check_digit: number;
  corrected: string;
}

export async function luhnCheck(input: string): Promise<LuhnReport> {
  const raw = await runAction<RawReport>("luhn.check", { input });
  return {
    digits: raw.digits,
    valid: raw.valid,
    checksumMod10: raw.checksum_mod_10,
    expectedCheckDigit: raw.expected_check_digit,
    providedCheckDigit: raw.provided_check_digit,
    corrected: raw.corrected,
  };
}

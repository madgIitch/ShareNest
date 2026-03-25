export function normalizePhoneNumber(input: string): string {
  const cleaned = input.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    return `+${cleaned}`;
  }
  return cleaned;
}

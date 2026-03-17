import { normalizePhoneNumber } from "../src/lib/phone";

describe("normalizePhoneNumber", () => {
  it("adds + when missing", () => {
    expect(normalizePhoneNumber("4915123456789")).toBe("+4915123456789");
  });

  it("removes separators", () => {
    expect(normalizePhoneNumber("+49 151-234-567")).toBe("+49151234567");
  });
});

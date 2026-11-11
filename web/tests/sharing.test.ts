import { describe, expect, it } from "vitest";
import { parseInvitation } from "@/features/sharing/parse-invitation";

const origin = "https://doctor.example";
describe("invitation parsing", () => {
  it.each([
    "https://doctor.example/doctor/consultation/token-123",
    "/consultation/token-123",
    "/demo/doctor/consultation/token-123/",
    "  token-123  ",
  ])("extracts only the supported token from %s", (value) => {
    expect(parseInvitation(value, origin)).toBe("token-123");
  });
  it.each([
    "",
    "short",
    "x".repeat(4097),
    "https://evil.example/doctor/consultation/token-123",
    "//evil.example/consultation/token-123",
    "javascript:alert(1)",
    "https://user:password@doctor.example/doctor/consultation/token-123",
    "/doctor/consultation/token-123?tracking=1",
    "/doctor/consultation/token-123#tracking",
    "/doctor/patients/person-123",
    "/doctor/consultation/token%2f123",
  ])("rejects unsafe or unsupported input %s", (value) => {
    expect(() => parseInvitation(value, origin)).toThrow();
  });
});

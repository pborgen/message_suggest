import { describe, it, expect } from "vitest";
import { ResponseSchema } from "./server";

describe("ResponseSchema", () => {
  it("accepts valid response shape", () => {
    const sample = {
      short: ["ok", "sure", "sounds good"],
      long: "That works for me. See you then."
    };

    const parsed = ResponseSchema.safeParse(sample);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid response shape", () => {
    const sample = {
      short: ["only two", "items"],
      long: ""
    };

    const parsed = ResponseSchema.safeParse(sample);
    expect(parsed.success).toBe(false);
  });
});

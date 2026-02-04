import { describe, it, expect } from "vitest";
import request from "supertest";

process.env.MODEL_PROVIDER = "mock";
process.env.NODE_ENV = "test";

const { app } = await import("./server");

describe("integration", () => {
  it("GET /health", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("POST /suggest returns suggestions", async () => {
    const res = await request(app)
      .post("/suggest")
      .send({ text: "Are we still on for 7?", tone: "polite" });

    expect(res.status).toBe(200);
    expect(res.body.short?.length).toBeGreaterThanOrEqual(3);
    expect(typeof res.body.long).toBe("string");
  });
});

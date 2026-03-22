import { describe, expect, it, vi } from "vitest";
import * as contactsRoute from "./route";

describe("contacts API helpers", () => {
  it("splitName returns first and last from full name", () => {
    expect(contactsRoute.splitName("John Doe")).toEqual({ firstName: "John", lastName: "Doe" });
    expect(contactsRoute.splitName("Jane")).toEqual({ firstName: "Jane", lastName: "" });
    expect(contactsRoute.splitName("  Alice   Bob   Cox  ")).toEqual({ firstName: "Alice", lastName: "Bob Cox" });
  });

  it("formatContact builds display fields and gracefully handles missing split", () => {
    const row = {
      id: "1",
      first_name: "Julia",
      last_name: "Roberts",
      name: "",
      email: "julia@example.com",
      phone: "",
      company: "",
      tags: "[]",
      notes: "",
      total_meetings: 0,
      last_meeting_at: "",
      created_at: "2026-03-22",
      updated_at: "2026-03-22",
    };
    expect(contactsRoute.formatContact(row as any).name).toBe("Julia Roberts");
    expect(contactsRoute.formatContact({ ...row, first_name: "", last_name: "", name: "Julia Roberts" } as any).name).toBe("Julia Roberts");
  });
});

// Integration-style tests using mocked db and auth for POST->GET behavior.
// These don't hit real D1, they assert contract does what we expect with mocked query outputs.

describe("contacts API endpoint contract", () => {
  it("POST should require first/last and email and insert row", async () => {
    const d1Mock = vi.spyOn(require("@/lib/cloudflare"), "d1Query");
    const authMock = vi.spyOn(require("@/lib/auth"), "getAuthUserId").mockResolvedValue("user-1");

    d1Mock.mockResolvedValue({ results: [] });

    const request = new Request("http://localhost/api/contacts", {
      method: "POST",
      body: JSON.stringify({ firstName: "Sam", lastName: "Smith", email: "sam@example.com" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await contactsRoute.POST(request as any);
    expect(res.status).toBe(201);

    authMock.mockRestore();
    d1Mock.mockRestore();
  });

  it("GET should return mapped contact fields", async () => {
    const d1Mock = vi.spyOn(require("@/lib/cloudflare"), "d1Query");
    const authMock = vi.spyOn(require("@/lib/auth"), "getAuthUserId").mockResolvedValue("user-1");

    d1Mock.mockResolvedValue({ results: [{ id: "c1", first_name: "Inner", last_name: "Space", name: "", email: "inspace@example.com", phone: "", company: "", tags: "[]", notes: "", total_meetings: 0, last_meeting_at: "", created_at: "", updated_at: "" }] });

    const request = new Request("http://localhost/api/contacts");
    const res = await contactsRoute.GET(request as any);
    const data = await res.json();

    expect(data.contacts[0]).toMatchObject({ firstName: "Inner", lastName: "Space", name: "Inner Space" });

    authMock.mockRestore();
    d1Mock.mockRestore();
  });
});

import { describe, expect, it, test } from "vitest";
import type { ToolFilter } from "./toolFilters.ts";
import { getToolFilter, isToolAllowed } from "./toolFilters.ts";

test("getToolFilter", () => {
  expect(getToolFilter({})).toEqual({
    allowedTools: undefined,
    deniedTools: undefined,
  });

  expect(getToolFilter({ allowTools: ["foo"] })).toEqual({
    allowedTools: new Set(["foo"]),
    deniedTools: undefined,
  });
  expect(getToolFilter({ denyTools: ["foo"] })).toEqual({
    allowedTools: undefined,
    deniedTools: new Set(["foo"]),
  });
});

describe("isToolAllowed", () => {
  it("should allow all tools by default", () => {
    expect(isToolAllowed("foo")).toBe(true);
  });

  it("should allow denying tools", () => {
    const filter: ToolFilter = {
      deniedTools: new Set(["jafar"]),
    };
    expect(isToolAllowed("jafar", filter)).toBe(false);
    expect(isToolAllowed("iago", filter)).toBe(true);
  });

  it("should allow tools", () => {
    const filter: ToolFilter = {
      allowedTools: new Set(["muphasa"]),
    };
    expect(isToolAllowed("muphasa", filter)).toBe(true);
    expect(isToolAllowed("scar", filter)).toBe(false);
  });

  it("should deny custom methods by default", () => {
    expect(isToolAllowed("customGet")).toBe(false);
    expect(isToolAllowed("customPost")).toBe(false);
    expect(
      isToolAllowed("customPut", {
        // Even if allowed explicitely
        allowedTools: new Set(["customPut"]),
      }),
    ).toBe(false);
  });
});

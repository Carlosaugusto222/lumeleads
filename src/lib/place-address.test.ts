import { describe, expect, test } from "bun:test";
import { resolvePlaceAddress } from "./place-address";

const fallback = { city: "Recife", state: "Pernambuco", country: "Brasil" };

describe("Google Places address parsing", () => {
  test("missing component types do not interrupt search and preserve fallback location", () => {
    expect(resolvePlaceAddress([{ longText: "Rua sem tipo" }, { types: null }, null], fallback)).toEqual(fallback);
  });

  test("missing address components preserve the search location", () => {
    expect(resolvePlaceAddress(undefined, fallback)).toEqual(fallback);
  });

  test("valid components after incomplete entries still supply city, state and country", () => {
    expect(resolvePlaceAddress([
      { longText: "Sem tipo" },
      { types: ["administrative_area_level_2"], longText: "Olinda" },
      { types: ["administrative_area_level_1"], shortText: "PE" },
      { types: ["country"], longText: "Brasil" },
    ], fallback)).toEqual({ city: "Olinda", state: "PE", country: "Brasil" });
  });

  test("locality is used when no municipality component is present", () => {
    expect(resolvePlaceAddress([{ types: ["locality"], longText: "Paulista" }], fallback).city).toBe("Paulista");
  });
});
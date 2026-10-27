import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { resolvePlaceAddress } from "./place-address";

const fallback = { city: "Recife", state: "Pernambuco", country: "Brasil" };

describe("Google Places address parsing", () => {
  test("missing component types do not interrupt search and preserve fallback location", () => {
    assert.deepEqual(resolvePlaceAddress([{ longText: "Rua sem tipo" }, { types: null }, null], fallback), fallback);
  });

  test("missing address components preserve the search location", () => {
    assert.deepEqual(resolvePlaceAddress(undefined, fallback), fallback);
  });

  test("valid components after incomplete entries still supply city, state and country", () => {
    assert.deepEqual(resolvePlaceAddress([
      { longText: "Sem tipo" },
      { types: ["administrative_area_level_2"], longText: "Olinda" },
      { types: ["administrative_area_level_1"], shortText: "PE" },
      { types: ["country"], longText: "Brasil" },
    ], fallback), { city: "Olinda", state: "PE", country: "Brasil" });
  });

  test("locality is used when no municipality component is present", () => {
    assert.equal(resolvePlaceAddress([{ types: ["locality"], longText: "Paulista" }], fallback).city, "Paulista");
  });
});
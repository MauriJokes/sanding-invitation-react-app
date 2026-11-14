import { describe, expect, it } from "vitest";
import { hasUniqueCanonicalKeyIndex } from "../../server/db/indexes";

describe("hasUniqueCanonicalKeyIndex", () => {
  const id = { key: { _id: 1 } };

  it("accepts a full unique index on canonicalGroupKey", () => {
    expect(hasUniqueCanonicalKeyIndex([id, { key: { canonicalGroupKey: 1 }, unique: true }])).toBe(true);
  });

  it.each([
    ["no indexes at all", []],
    ["only the default _id index", [id]],
    ["a non-unique index on the field", [id, { key: { canonicalGroupKey: 1 } }]],
    ["unique: false", [id, { key: { canonicalGroupKey: 1 }, unique: false }]],
    ["a unique index that is only partial", [id, { key: { canonicalGroupKey: 1 }, unique: true, partialFilterExpression: { status: "attending" } }]],
    ["a unique index on a different field", [id, { key: { familyGroupName: 1 }, unique: true }]],
    ["a compound unique index", [id, { key: { canonicalGroupKey: 1, status: 1 }, unique: true }]],
    ["a descending index", [id, { key: { canonicalGroupKey: -1 }, unique: true }]],
    ["unique given as a string", [id, { key: { canonicalGroupKey: 1 }, unique: "true" }]],
  ])("rejects %s", (_name, indexes) => {
    expect(hasUniqueCanonicalKeyIndex(indexes)).toBe(false);
  });
});

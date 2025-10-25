function sortKeys(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value && typeof value === "object" && value.constructor === Object) {
    const entries = Object.entries(value)
      .map(([k, v]) => [k, sortKeys(v)])
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    const out = {};
    for (const [k, v] of entries) out[k] = v;
    return out;
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(sortKeys(value));
}

export function fingerprintPayload(value) {
  return stableStringify(value);
}

function pickFields(item, fields) {
  if (!fields.length || item === null || typeof item !== "object" || Array.isArray(item)) {
    return item;
  }

  return Object.fromEntries(fields.filter((key) => key in item).map((key) => [key, item[key]]));
}

export function createOutput({ json, yaml, isTTY, fields, limit }) {
  const mode = json || !isTTY ? "json" : yaml ? "yaml" : "table";
  const keys = fields ? fields.split(",").map((field) => field.trim()).filter(Boolean) : [];
  const cap = Number.parseInt(limit ?? "100", 10);

  return {
    mode,
    serialize(data) {
      const normalized = Array.isArray(data)
        ? data.slice(0, Number.isNaN(cap) ? 100 : cap).map((item) => pickFields(item, keys))
        : pickFields(data, keys);

      return `${JSON.stringify(normalized, null, 2)}\n`;
    },
  };
}

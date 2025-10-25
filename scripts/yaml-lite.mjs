#!/usr/bin/env node
import assert from "node:assert";

function countIndent(line) {
  let count = 0;
  while (count < line.length && line[count] === " ") count += 1;
  return count;
}

function splitTopLevel(str) {
  const parts = [];
  let current = "";
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < str.length; i += 1) {
    const ch = str[i];
    if (inSingle) {
      if (ch === "'" && str[i - 1] !== "\\") inSingle = false;
      current += ch;
      continue;
    }
    if (inDouble) {
      if (ch === "\"" && str[i - 1] !== "\\") inDouble = false;
      current += ch;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      current += ch;
      continue;
    }
    if (ch === "\"") {
      inDouble = true;
      current += ch;
      continue;
    }
    if (ch === "[" || ch === "{") {
      depth += 1;
      current += ch;
      continue;
    }
    if (ch === "]" || ch === "}") {
      depth -= 1;
      current += ch;
      continue;
    }
    if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseScalar(text) {
  if (text === "~" || text === "null") return null;
  if (text === "true") return true;
  if (text === "false") return false;
  if (/^[-+]?[0-9]+(\.[0-9]+)?$/.test(text)) return Number(text);
  if (text.startsWith("\"") && text.endsWith("\"")) {
    try {
      return JSON.parse(text);
    } catch {
      return text.slice(1, -1);
    }
  }
  if (text.startsWith("'") && text.endsWith("'")) {
    return text.slice(1, -1).replace(/''/g, "'");
  }
  if (text.startsWith("[") && text.endsWith("]")) {
    const inner = text.slice(1, -1).trim();
    if (!inner) return [];
    return splitTopLevel(inner).map(part => parseScalar(part));
  }
  if (text.startsWith("{") && text.endsWith("}")) {
    const inner = text.slice(1, -1).trim();
    if (!inner) return {};
    const obj = {};
    for (const piece of splitTopLevel(inner)) {
      const idx = piece.indexOf(":");
      if (idx === -1) throw new Error(`Invalid inline object: ${piece}`);
      const key = piece.slice(0, idx).trim();
      const valueText = piece.slice(idx + 1).trim();
      obj[key] = parseScalar(valueText);
    }
    return obj;
  }
  return text;
}

function peekNext(lines, start) {
  for (let i = start; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    return { indent: countIndent(lines[i]), trimmed };
  }
  return null;
}

function makeScalarContinuation(container, key, indent) {
  return {
    indent,
    append(text) {
      if (Array.isArray(container)) {
        container[key] = `${container[key]} ${text}`.replace(/\s+/g, " ").trim();
      } else {
        container[key] = `${container[key]} ${text}`.replace(/\s+/g, " ").trim();
      }
    }
  };
}

function isDoubleQuotedComplete(text) {
  let escaped = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"' && i !== 0) {
      return true;
    }
  }
  return text.endsWith('"');
}

function normalizeLines(source) {
  const raw = source.replace(/\r\n?/g, "\n").split("\n");
  const normalized = [];
  for (let i = 0; i < raw.length; i += 1) {
    let line = raw[i];
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const colonIndex = trimmed.indexOf(":");
      if (colonIndex !== -1) {
        const valueText = trimmed.slice(colonIndex + 1).trim();
        if (valueText.startsWith('"') && !isDoubleQuotedComplete(valueText)) {
          let combined = valueText;
          let j = i;
          while (j + 1 < raw.length) {
            j += 1;
            const nextTrimmed = raw[j].trim();
            if (!nextTrimmed && !isDoubleQuotedComplete(combined)) {
              combined += " ";
              continue;
            }
            combined += ` ${nextTrimmed}`;
            if (isDoubleQuotedComplete(combined)) break;
          }
          if (!isDoubleQuotedComplete(combined)) {
            throw new Error(`Unterminated double-quoted scalar near line ${i + 1}`);
          }
          line = `${line.slice(0, line.indexOf(':') + 1)} ${combined}`;
          i = j;
        }
      }
    }
    normalized.push(line);
  }
  return normalized;
}

export function parse(source) {
  const lines = normalizeLines(source);
  const root = {};
  const stack = [{ indent: -1, type: "map", value: root }];
  let pending = null;

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const indent = countIndent(raw);

    if (pending && indent > pending.indent && !trimmed.startsWith("- ") && !trimmed.includes(":")) {
      pending.append(trimmed);
      continue;
    }
    pending = null;

    while (stack.length && indent <= stack[stack.length - 1].indent) stack.pop();
    const ctx = stack[stack.length - 1];
    assert(ctx, "YAML parse error: unexpected dedent");

    if (trimmed.startsWith("- ")) {
      assert(ctx.type === "seq", "YAML parse error: sequence item without parent sequence");
      const rest = trimmed.slice(2).trim();
      if (!rest) {
        const item = {};
        ctx.value.push(item);
        stack.push({ indent, type: "map", value: item });
        continue;
      }
      if (rest.includes(":")) {
        const idx = rest.indexOf(":");
        const key = rest.slice(0, idx).trim();
        const valueText = rest.slice(idx + 1).trim();
        const item = {};
        ctx.value.push(item);
        stack.push({ indent, type: "map", value: item });
        if (valueText) {
          const value = parseScalar(valueText);
          item[key] = value;
          if (typeof value === "string" && !/^['"[{]/.test(valueText)) {
            pending = makeScalarContinuation(item, key, indent);
          } else if (Array.isArray(value)) {
            stack.push({ indent, type: "seq", value });
          } else if (value && typeof value === "object") {
            stack.push({ indent, type: "map", value });
          }
        } else {
          const next = peekNext(lines, i + 1);
          if (next && next.indent > indent) {
            if (next.trimmed.startsWith("- ")) {
              const seq = [];
              item[key] = seq;
              stack.push({ indent, type: "seq", value: seq });
            } else {
              const map = {};
              item[key] = map;
              stack.push({ indent, type: "map", value: map });
            }
          } else {
            item[key] = null;
          }
        }
        continue;
      }
      const value = parseScalar(rest);
      ctx.value.push(value);
      if (typeof value === "string" && !/^['"[{]/.test(rest)) {
        pending = makeScalarContinuation(ctx.value, ctx.value.length - 1, indent);
      } else if (Array.isArray(value)) {
        stack.push({ indent, type: "seq", value });
      } else if (value && typeof value === "object") {
        stack.push({ indent, type: "map", value });
      }
      continue;
    }

    const colon = trimmed.indexOf(":");
    assert(colon !== -1, `YAML parse error: expected ':' in line "${trimmed}"`);
    const key = trimmed.slice(0, colon).trim();
    let valueText = trimmed.slice(colon + 1).trim();
    if (ctx.type === "seq") {
      // Promote implicit map for sequence item
      const map = {};
      ctx.value.push(map);
      stack.push({ indent: ctx.indent, type: "map", value: map });
      stack.push({ indent, type: "map", value: map });
      map[key] = valueText ? parseScalar(valueText) : null;
      if (valueText) {
        const val = map[key];
        if (typeof val === "string" && !/^['"[{]/.test(valueText)) {
          pending = makeScalarContinuation(map, key, indent);
        } else if (Array.isArray(val)) {
          stack.push({ indent, type: "seq", value: val });
        } else if (val && typeof val === "object") {
          stack.push({ indent, type: "map", value: val });
        }
      } else {
        const next = peekNext(lines, i + 1);
        if (next && next.indent > indent) {
          if (next.trimmed.startsWith("- ")) {
            const seq = [];
            map[key] = seq;
            stack.push({ indent, type: "seq", value: seq });
          } else {
            const sub = {};
            map[key] = sub;
            stack.push({ indent, type: "map", value: sub });
          }
        }
      }
      continue;
    }

    assert(ctx.type === "map", "YAML parse error: mapping entry without parent map");
    if (!valueText) {
      const next = peekNext(lines, i + 1);
      if (next && next.indent > indent) {
        if (next.trimmed.startsWith("- ")) {
          const seq = [];
          ctx.value[key] = seq;
          stack.push({ indent, type: "seq", value: seq });
        } else {
          const map = {};
          ctx.value[key] = map;
          stack.push({ indent, type: "map", value: map });
        }
      } else {
        ctx.value[key] = null;
      }
      continue;
    }

    const value = parseScalar(valueText);
    ctx.value[key] = value;
    if (typeof value === "string" && !/^['"[{]/.test(valueText)) {
      pending = makeScalarContinuation(ctx.value, key, indent);
    } else if (Array.isArray(value)) {
      stack.push({ indent, type: "seq", value });
    } else if (value && typeof value === "object") {
      stack.push({ indent, type: "map", value });
    }
  }

  return root;
}

function isScalar(value) {
  return value === null || typeof value !== "object";
}

function needsQuoting(str) {
  return (
    str === "" ||
    /^\s|\s$/.test(str) ||
    /[:#{}\[\],&*?]|^-|^!|^@|^`/.test(str) ||
    /\n/.test(str)
  );
}

function formatString(str) {
  if (!needsQuoting(str)) return str;
  return JSON.stringify(str);
}

function formatScalar(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : JSON.stringify(value);
  return formatString(String(value));
}

function formatValue(value, indent) {
  const pad = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return [pad + "[]"];
    const lines = [];
    for (const item of value) {
      if (isScalar(item)) {
        lines.push(`${pad}- ${formatScalar(item)}`);
      } else {
        const sub = formatValue(item, indent + 2);
        lines.push(`${pad}- ${sub.shift().trimStart()}`);
        for (const line of sub) {
          lines.push(line);
        }
      }
    }
    return lines;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return [pad + "{}"];
    const lines = [];
    for (const [key, val] of entries) {
      if (isScalar(val)) {
        lines.push(`${pad}${key}: ${formatScalar(val)}`);
      } else {
        lines.push(`${pad}${key}:`);
        const sub = formatValue(val, indent + 2);
        lines.push(...sub);
      }
    }
    return lines;
  }
  return [pad + formatScalar(value)];
}

export function stringify(value) {
  return formatValue(value, 0).join("\n") + "\n";
}

#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const RUBY_SCRIPT_PARSE = `require "yaml"\nrequire "json"\nrequire "date"\ntext = STDIN.read\nobj = YAML.safe_load(text, permitted_classes: [Symbol, Time, Date], aliases: true)\nSTDOUT.write JSON.generate(obj)`;
const RUBY_SCRIPT_DUMP = `require "yaml"\nrequire "json"\nobj = JSON.parse(STDIN.read)\nstr = YAML.dump(obj)\nstr = str.sub(/^---\\s*/m, "")\nSTDOUT.write str`;

function runRuby(script, input) {
  const result = spawnSync("ruby", ["-e", script], {
    input,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });
  if (result.status !== 0) {
    const stderr = result.stderr || "unknown error";
    throw new Error(`ruby yaml helper failed: ${stderr.trim()}`);
  }
  return result.stdout;
}

export function parseYaml(text) {
  const output = runRuby(RUBY_SCRIPT_PARSE, text ?? "");
  return output ? JSON.parse(output) : null;
}

export function dumpYaml(value) {
  return runRuby(RUBY_SCRIPT_DUMP, JSON.stringify(value ?? null));
}

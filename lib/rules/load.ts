import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { RuleSet } from "./types";

let cache: RuleSet | null = null;

function readYaml<T>(dir: string, file: string): T {
  return yaml.load(fs.readFileSync(path.join(dir, file), "utf8")) as T;
}

/** Loads all rule YAML files from /rules. Cached for the process lifetime. */
export function loadRules(dir = path.join(process.cwd(), "rules")): RuleSet {
  if (cache) return cache;
  cache = {
    general: readYaml(dir, "general.yaml"),
    closedSeasons: readYaml(dir, "closed_seasons.yaml"),
    minSizes: readYaml(dir, "min_sizes.yaml"),
    prohibited: readYaml(dir, "prohibited.yaml"),
    areas: readYaml(dir, "areas.yaml"),
    permits: readYaml(dir, "permits.yaml"),
  };
  return cache;
}

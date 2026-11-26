import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { Text } from "./rules/types";
import { toIso } from "./rules/dates";

/** Privacy policy (data/privacy.yaml), shown on /privatnost. */
export interface Privacy {
  vrijedi_od: string;
  voditelj: { ime: string; email: string };
  odjeljci: { naslov: Text; tekst: Text }[];
}

export function loadPrivacy(file = path.join(process.cwd(), "data/privacy.yaml")): Privacy {
  const y = yaml.load(fs.readFileSync(file, "utf8")) as Omit<Privacy, "vrijedi_od"> & { vrijedi_od: string | Date };
  return { ...y, vrijedi_od: toIso(y.vrijedi_od) ?? "" };
}

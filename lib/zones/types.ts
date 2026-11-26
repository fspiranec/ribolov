export interface ZoneHit {
  layer: string;
  priority: number;
  rule_key: string;
  name: string | null;
  source: string | null;
  placeholder: boolean;
  needs_legal_check: boolean;
  props: Record<string, unknown>;
  geomKind: "polygon" | "point" | "line";
  /** Point lies inside the polygon (always false for points/lines). */
  inside: boolean;
  /** Distance from the pin to the geometry in metres (0 if inside). */
  distance_m: number;
  /** Distance from the pin to the polygon boundary in metres (null for non-polygons). */
  boundary_m: number | null;
}

export interface ZoneProvider {
  /** All features within radiusM of the point (including those containing it). */
  query(lat: number, lon: number, radiusM: number): Promise<ZoneHit[]>;
  /** Layers that have at least one real (imported) feature loaded. */
  loadedLayers(): Promise<Set<string>>;
}

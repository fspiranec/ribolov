import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Rule YAML and GeoJSON files are read from disk at runtime by the API.
  // (data/bathymetry is optional and large; it is not shipped – depth then comes from the EMODnet REST service.)
  outputFileTracingIncludes: {
    "/api/pin": ["./rules/**/*", "./data/manual/**/*", "./data/imported/**/*", "./data/*.json"],
    // the page and the link preview image answer shared links on the server
    "/": ["./rules/**/*", "./data/manual/**/*", "./data/imported/**/*", "./data/*.json"],
    "/privatnost": ["./data/privacy.yaml"],
    "/og": ["./rules/**/*", "./data/manual/**/*", "./data/imported/**/*", "./data/*.json"],
    "/api/species": ["./rules/**/*", "./data/species/**/*", "./data/recipes.yaml"],
    "/api/catch": ["./rules/**/*", "./data/species/**/*"],
    "/api/rules": ["./rules/**/*"],
  },
  serverExternalPackages: ["pg", "geotiff"],
};

export default nextConfig;

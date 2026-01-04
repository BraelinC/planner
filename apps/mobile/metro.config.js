const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Let Metro know where to resolve packages - include the .bun symlink directory
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(projectRoot, "node_modules/.bun"),
  path.resolve(monorepoRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules/.bun"),
];

// Enable following symlinks for Bun's node_modules structure
config.resolver.unstable_enableSymlinks = true;

module.exports = config;

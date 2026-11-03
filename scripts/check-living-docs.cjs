#!/usr/bin/env node
/**
 * Puerta de documentación viva.
 * Si cambia backend, frontend, base de datos u otra superficie configurada,
 * el mismo entregable debe actualizar los documentos mapeados.
 *
 * Uso:
 *   node scripts/check-living-docs.cjs
 *   BASE_SHA=<sha> HEAD_SHA=<sha> node scripts/check-living-docs.cjs
 */

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
function resolveConfigPath() {
  const override = process.env.LIVING_DOCS_CONFIG;
  if (!override) {
    return path.join(ROOT, ".living-docs.json");
  }
  const resolved = path.resolve(ROOT, override);
  const relative = path.relative(ROOT, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail("LIVING_DOCS_CONFIG debe apuntar a un archivo dentro del repositorio.");
  }
  return resolved;
}

function git(args) {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function loadConfig() {
  const configPath = resolveConfigPath();
  if (!fs.existsSync(configPath)) {
    fail(`No existe ${path.relative(ROOT, configPath)}.`);
  }
  console.log(`[living-docs] config ${path.relative(ROOT, configPath)}`);
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function globToRegExp(glob) {
  const normalized = glob.replace(/\\/g, "/").replace(/^\.\//, "");
  let regex = "";
  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];
    const next = normalized[i + 1];
    if (char === "*" && next === "*") {
      const after = normalized[i + 2];
      if (after === "/") {
        regex += "(?:.*/)?";
        i += 2;
      } else {
        regex += ".*";
        i += 1;
      }
    } else if (char === "*") {
      regex += "[^/]*";
    } else if (char === "?") {
      regex += "[^/]";
    } else if ("\\.^$+()[]{}|".includes(char)) {
      regex += `\\${char}`;
    } else {
      regex += char;
    }
  }
  return new RegExp(`^${regex}$`);
}

function matches(filePath, pattern) {
  const file = filePath.replace(/\\/g, "/").replace(/^\.\//, "");
  const glob = pattern.replace(/\\/g, "/").replace(/^\.\//, "");
  if (glob.endsWith("/**")) {
    const prefix = glob.slice(0, -3);
    if (file === prefix || file.startsWith(`${prefix}/`)) {
      return true;
    }
  }
  return globToRegExp(glob).test(file);
}

function matchesAny(filePath, patterns) {
  return patterns.some((pattern) => matches(filePath, pattern));
}

function resolveRange() {
  const envBase = process.env.BASE_SHA;
  const envHead = process.env.HEAD_SHA || "HEAD";

  if (envBase && envBase !== "0000000000000000000000000000000000000000") {
    return { base: envBase, head: envHead };
  }

  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch === "HEAD") {
    return { base: "HEAD^", head: "HEAD" };
  }

  for (const candidate of ["origin/main", "origin/master", "main", "master"]) {
    try {
      git(["rev-parse", "--verify", candidate]);
      const mergeBase = git(["merge-base", candidate, "HEAD"]);
      return { base: mergeBase, head: "HEAD" };
    } catch {
      // try next
    }
  }

  try {
    return { base: "HEAD^", head: "HEAD" };
  } catch {
    fail("No se pudo determinar el rango de commits a comparar.");
  }
}

function changedFiles(base, head) {
  const output = git(["diff", "--name-only", "--diff-filter=ACMRD", `${base}...${head}`]);
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

function diffHasSubstance(base, head, files) {
  if (files.length === 0) {
    return false;
  }
  const output = git(["diff", "--unified=0", `${base}...${head}`, "--", ...files]);
  return output.split(/\r?\n/).some((line) => {
    if (!line.startsWith("+") || line.startsWith("+++")) {
      return false;
    }
    return line.slice(1).trim().length > 0;
  });
}

function fail(message) {
  console.error(`\n[living-docs] BLOQUEADO\n${message}\n`);
  process.exit(1);
}

function main() {
  const config = loadConfig();
  const { base, head } = resolveRange();
  const files = changedFiles(base, head);
  const ignore = config.ignore || [];
  const relevant = files.filter((file) => !matchesAny(file, ignore));

  console.log(`[living-docs] rango ${base}...${head}`);
  console.log(`[living-docs] archivos cambiados: ${files.length} (relevantes: ${relevant.length})`);

  if (relevant.length === 0) {
    console.log("[living-docs] sin cambios de comportamiento. OK.");
    return;
  }

  const failures = [];

  for (const [name, surface] of Object.entries(config.surfaces || {})) {
    const codeHits = relevant.filter((file) => matchesAny(file, surface.code || []));
    if (codeHits.length === 0) {
      continue;
    }

    const docHits = relevant.filter((file) => matchesAny(file, surface.docs || []));
    const requiredDocs = surface.docs || [];
    const substance = diffHasSubstance(base, head, docHits);

    if (docHits.length === 0 || !substance) {
      failures.push(
        [
          `Superficie "${name}" cambió y la documentación mapeada no se actualizó.`,
          `  Código: ${codeHits.join(", ")}`,
          `  Docs requeridos (al menos una ruta, con contenido real): ${requiredDocs.join(", ")}`,
        ].join("\n")
      );
    } else {
      console.log(`[living-docs] ${name}: código + docs OK (${docHits.join(", ")})`);
    }
  }

  if (config.requireDocsRootChange) {
    const docsRoot = (config.docsRoot || "docs").replace(/\\/g, "/");
    const docsChanged = relevant.some(
      (file) => file === docsRoot || file.startsWith(`${docsRoot}/`)
    );
    const codeOutsideDocs = relevant.some(
      (file) => file !== docsRoot && !file.startsWith(`${docsRoot}/`)
    );
    if (codeOutsideDocs && !docsChanged) {
      failures.push(
        `Hay cambios fuera de ${docsRoot}/ y no hay ningún archivo actualizado dentro de ${docsRoot}/.`
      );
    }
  }

  if (failures.length > 0) {
    fail(
      [
        "Cada superficie con código cambiado debe actualizar su documentación mapeada en el mismo entregable.",
        "Un checkbox no basta: este job tiene que pasar para fusionar.",
        "",
        ...failures,
        "",
        "Ajusta las rutas en el mapa de documentación viva si la estructura del repo es distinta.",
        "Guía: standards/living-docs-ci.md",
      ].join("\n")
    );
  }

  console.log("[living-docs] documentación viva: OK.");
}

main();

import { readdir, readFile, writeFile, stat } from "node:fs/promises";

// Keep regenerated schema imports valid for Node's ESM resolver as well as Vite.
async function normalize(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const url = new URL(entry.name, directory);
    if (entry.isDirectory()) {
      await normalize(new URL(`${entry.name}/`, directory));
    } else if (entry.name.endsWith(".ts")) {
      const source = await readFile(url, "utf8");
      const imports = [...source.matchAll(/\bfrom\s+["'](\.{1,2}\/[^"']+)["']/g)];
      let result = source;
      for (const [, specifier] of imports) {
        if (/\.(?:[cm]?[jt]s|json)$/.test(specifier)) continue;
        const isDirectory = await stat(new URL(specifier, directory))
          .then(info => info.isDirectory(), () => false);
        result = result.replaceAll(
          `"${specifier}"`, `"${specifier}${isDirectory ? "/index.js" : ".js"}"`,
        ).replaceAll(
          `'${specifier}'`, `'${specifier}${isDirectory ? "/index.js" : ".js"}'`,
        );
      }
      if (result !== source) await writeFile(url, result);
    }
  }
}

await normalize(new URL("../api-zod/src/generated/", import.meta.url));

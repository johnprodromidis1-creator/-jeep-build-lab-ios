import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import test, { after, afterEach } from "node:test";
import { build } from "esbuild";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = path.join(root, ".sites-runtime", "platform-tests");
await mkdir(output, { recursive: true });
let native = false;
const calls = [];

function resolveLocal(specifier, resolveDir) {
  const base = specifier.startsWith("@/")
    ? path.join(root, specifier.slice(2))
    : path.resolve(resolveDir, specifier);
  for (const candidate of [base, base + ".ts", base + ".tsx", base + ".json"]) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`Could not resolve ${specifier} from ${resolveDir}`);
}

async function bundlePlatform() {
  const entry = path.join(root, "lib/platform.ts");
  const outfile = path.join(output, `platform-${Date.now()}-${Math.random()}.mjs`);
  await build({
    absWorkingDir: root,
    stdin: {
      contents: await readFile(entry, "utf8"),
      sourcefile: "platform.ts",
      resolveDir: path.dirname(entry),
      loader: "ts",
    },
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    plugins: [{
      name: "capacitor-stubs",
      setup(b) {
        b.onResolve({ filter: /^@capacitor\/core$/ }, () => ({ path: "core", namespace: "cap" }));
        b.onResolve({ filter: /^@capacitor\/browser$/ }, () => ({ path: "browser", namespace: "cap" }));
        b.onResolve({ filter: /^@capacitor\/share$/ }, () => ({ path: "share", namespace: "cap" }));
        b.onResolve({ filter: /^@capacitor\/filesystem$/ }, () => ({ path: "filesystem", namespace: "cap" }));
        b.onResolve({ filter: /^@\// }, args => ({ path: resolveLocal(args.path, root) }));
        b.onResolve({ filter: /^\./ }, args => ({ path: resolveLocal(args.path, args.resolveDir) }));
        b.onLoad({ filter: /^core$/, namespace: "cap" }, () => ({
          contents: "export const Capacitor = { isNativePlatform: () => globalThis.__platformNative };",
        }));
        b.onLoad({ filter: /^browser$/, namespace: "cap" }, () => ({
          contents: "export const Browser = { open: async options => globalThis.__platformCalls.push(['browser', options]) };",
        }));
        b.onLoad({ filter: /^share$/, namespace: "cap" }, () => ({
          contents: "export const Share = { share: async options => globalThis.__platformCalls.push(['share', options]) };",
        }));
        b.onLoad({ filter: /^filesystem$/, namespace: "cap" }, () => ({
          contents: "export const Directory = { Cache: 'CACHE' }; export const Encoding = { UTF8: 'UTF8' }; export const Filesystem = { writeFile: async options => { globalThis.__platformCalls.push(['write', options]); return { uri: 'cache://' + options.path }; }, deleteFile: async options => globalThis.__platformCalls.push(['delete', options]) };",
        }));
        b.onLoad({ filter: /\.(ts|tsx)$/ }, async args => ({
          contents: await readFile(args.path, "utf8"),
          loader: args.path.endsWith(".tsx") ? "tsx" : "ts",
        }));
        b.onLoad({ filter: /\.json$/ }, async args => ({ contents: await readFile(args.path, "utf8"), loader: "json" }));
      },
    }],
  });
  return import(pathToFileURL(outfile).href);
}

globalThis.__platformNative = native;
globalThis.__platformCalls = calls;

afterEach(() => {
  native = false;
  globalThis.__platformNative = native;
  calls.length = 0;
  delete globalThis.navigator;
  delete globalThis.window;
});

after(async () => {
  await rm(output, { recursive: true, force: true });
});

test("external links allow only HTTPS and mailto schemes", async () => {
  const { openExternal } = await bundlePlatform();
  const opened = [];
  globalThis.window = {
    location: { href: "" },
    open: (...args) => opened.push(args),
  };

  await openExternal("https://example.com/part");
  assert.deepEqual(opened[0], ["https://example.com/part", "_blank", "noopener,noreferrer"]);
  await openExternal("mailto:john@example.com?subject=Build%20Lab");
  assert.equal(globalThis.window.location.href, "mailto:john@example.com?subject=Build%20Lab");
  await assert.rejects(openExternal("javascript:alert(1)"), /Unsupported link/);
  await assert.rejects(openExternal("http://example.com"), /Unsupported link/);
});

test("native HTTPS links open through the Capacitor Browser plugin", async () => {
  native = true;
  globalThis.__platformNative = native;
  const { openExternal } = await bundlePlatform();

  await openExternal("https://example.com/part");
  assert.deepEqual(calls, [["browser", { url: "https://example.com/part" }]]);
});

test("build sharing is limited to public Jeep Build Lab build URLs", async () => {
  const { publicOrigin, shareLink } = await bundlePlatform();
  const writes = [];
  globalThis.navigator = { clipboard: { writeText: async value => writes.push(value) } };
  const url = `${publicOrigin}/#build=%7B%22year%22%3A2021%7D`;

  await shareLink(url);
  assert.equal(writes[0], url);
  await assert.rejects(shareLink("https://example.com/#build=%7B%7D"), /Unsupported share link/);
  await assert.rejects(shareLink(`${publicOrigin}/support`), /Unsupported share link/);
});

test("native file export normalizes filenames and cleans temporary cache files", async () => {
  native = true;
  globalThis.__platformNative = native;
  const { exportFile } = await bundlePlatform();

  await exportFile('../garage:"backup"?.json', "{}", "application/json");

  assert.equal(calls[0][0], "write");
  assert.match(calls[0][1].path, /^build-lab-[0-9a-f-]+-garage-backup-\.json$/);
  assert.equal(calls[1][0], "share");
  assert.deepEqual(calls[1][1].files, [`cache://${calls[0][1].path}`]);
  assert.equal(calls[2][0], "delete");
  assert.equal(calls[2][1].path, calls[0][1].path);
});

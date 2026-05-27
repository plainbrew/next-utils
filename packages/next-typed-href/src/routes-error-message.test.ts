import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";
import { describe, expect, test } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

const VIRTUAL_FILE = resolve(here, "__virtual__check__.ts");

function compileSnippet(source: string): string {
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2019,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    esModuleInterop: true,
    lib: ["lib.es2019.d.ts", "lib.dom.d.ts"],
    types: [],
  };
  const host = ts.createCompilerHost(compilerOptions, true);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, languageVersion, onError, shouldCreate) => {
    if (name === VIRTUAL_FILE) {
      return ts.createSourceFile(name, source, languageVersion, true);
    }
    return originalGetSourceFile(name, languageVersion, onError, shouldCreate);
  };
  host.fileExists = (name) => name === VIRTUAL_FILE || ts.sys.fileExists(name);
  host.readFile = (name) => (name === VIRTUAL_FILE ? source : ts.sys.readFile(name));

  const program = ts.createProgram([VIRTUAL_FILE], compilerOptions, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  return ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: () => here,
    getCanonicalFileName: (f) => f,
    getNewLine: () => "\n",
  });
}

describe("routes() type-argument guidance surfaces in TS error output", () => {
  test("defineTypedHref.routes() error mentions the guidance parameter name", () => {
    const output = compileSnippet(`
      import { defineTypedHref } from "./index";
      defineTypedHref.routes();
    `);
    expect(output).toContain("TS2554");
    expect(output).toContain(
      "Arguments for the rest parameter 'pass_Routes_and_RouteParamsMap_as_type_arguments'",
    );
  });

  test("defineTypedHrefWithNuqs.routes() error mentions the guidance parameter name", () => {
    const output = compileSnippet(`
      import { defineTypedHrefWithNuqs } from "./nuqs";
      defineTypedHrefWithNuqs.routes();
    `);
    expect(output).toContain("TS2554");
    expect(output).toContain(
      "Arguments for the rest parameter 'pass_Routes_and_RouteParamsMap_as_type_arguments'",
    );
  });

  test("defineTypedHref.routes<R, M>() with explicit args produces no error", () => {
    const output = compileSnippet(`
      import { defineTypedHref } from "./index";
      type R = "/";
      type M = { "/": Record<string, never> };
      defineTypedHref.routes<R, M>();
    `);
    expect(output).toBe("");
  });
});

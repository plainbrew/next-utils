import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";
import { describe, expect, test } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const virtualFile = resolve(here, "snippet.ts");

function compileSnippet(source: string): string {
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2019,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    esModuleInterop: true,
    lib: ["lib.es2019.d.ts", "lib.webworker.d.ts"],
    types: [],
  };
  const host = ts.createCompilerHost(compilerOptions, true);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, languageVersion, onError, shouldCreate) => {
    if (name === virtualFile) {
      return ts.createSourceFile(name, source, languageVersion, true);
    }
    return originalGetSourceFile(name, languageVersion, onError, shouldCreate);
  };

  const program = ts.createProgram([virtualFile], compilerOptions, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  return ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: () => here,
    getCanonicalFileName: (f) => f,
    getNewLine: () => "\n",
  });
}

describe("routes() type-argument guidance surfaces in TS error output", () => {
  test.each([
    {
      name: "defineTypedHref",
      source: `
        import { defineTypedHref } from "./index";
        defineTypedHref.routes();
      `,
    },
    {
      name: "defineTypedHrefWithNuqs",
      source: `
        import { defineTypedHrefWithNuqs } from "./nuqs";
        defineTypedHrefWithNuqs.routes();
      `,
    },
  ])("$name.routes() error mentions the guidance parameter name", ({ source }) => {
    const output = compileSnippet(source);
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

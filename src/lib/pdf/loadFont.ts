import fs from "fs";
import path from "path";

/**
 * Resolves a bundled Carlito font file to an absolute path for react-pdf's
 * Font.register.
 *
 * The previous code passed a plain relative path ("./fonts/Carlito-Regular.ttf")
 * straight to Font.register. That string is resolved against the process's
 * current working directory at the moment react-pdf actually opens the
 * file — and in a Vercel serverless function, that working directory is
 * not the folder this module lives in. The result was every PDF that uses
 * this font (every document, since Carlito is the base page font) failing
 * with ENOENT the moment it was actually rendered in production, even
 * though local builds and local test renders worked fine.
 *
 * Resolving to an absolute path ourselves — tried across a short list of
 * candidates that cover both how Next.js typically lays out traced files
 * and a couple of reasonable fallbacks — removes any dependence on
 * guessing the bundler's exact directory layout. react-pdf still does its
 * own file read internally from the path this returns; only the path
 * resolution changes. Throws a clear, specific error naming every path it
 * checked if none exist, rather than the generic ENOENT that gave no
 * indication of the cause.
 *
 * The turbopackIgnore comment below opts this dynamic fs.existsSync call
 * out of Turbopack's automatic file tracing. Without it, Turbopack can't
 * statically tell which of these candidate paths is actually needed, so
 * its fallback is to trace and bundle the entire project just to be
 * safe — real but unnecessary bloat. next.config.js already declares the
 * font folder explicitly via outputFileTracingIncludes for both PDF
 * routes, so Turbopack doesn't need to guess here; it can be told to
 * trust that instead.
 */
export function loadFont(fileName: string): string {
  const candidates = [
    path.join(__dirname, "fonts", fileName),
    path.join(process.cwd(), "src", "lib", "pdf", "fonts", fileName),
    path.join(process.cwd(), ".next", "server", "src", "lib", "pdf", "fonts", fileName),
    path.join(process.cwd(), "fonts", fileName),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(/* turbopackIgnore: true */ candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Could not locate font file "${fileName}". Checked: ${candidates.join(", ")}`
  );
}

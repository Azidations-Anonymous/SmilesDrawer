const fs = require("fs");
const path = require("path");
const Module = require("module");
const util = require("util");
const ts = require("typescript");

const ROOT_DIR = path.resolve(__dirname, "..");
const DEFAULT_OPTIONS_PATH = path.join(ROOT_DIR, "src/config/DefaultOptions.ts");
const README_PATH = path.join(ROOT_DIR, "README.md");
const START_MARKER = "<!-- AUTO-GENERATED:DEFAULT_OPTIONS_START -->";
const END_MARKER = "<!-- AUTO-GENERATED:DEFAULT_OPTIONS_END -->";

function compileDefaultOptionsModule(filePath = DEFAULT_OPTIONS_PATH) {
  const source = fs.readFileSync(filePath, "utf8");
  const { outputText, diagnostics } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      esModuleInterop: true
    },
    fileName: filePath,
    reportDiagnostics: true
  });

  if (diagnostics && diagnostics.length) {
    const message = diagnostics
      .map(diagnostic =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
      )
      .join("\n");
    throw new Error(`Failed to transpile ${filePath}:\n${message}`);
  }

  const mod = new Module(filePath, module);
  mod.filename = filePath;
  mod.paths = Module._nodeModulePaths(path.dirname(filePath));
  mod._compile(outputText, filePath);

  if (typeof mod.exports !== "function") {
    throw new Error("Expected DefaultOptions module to export a function.");
  }

  return mod.exports;
}

function formatDefaultOptions(filePath = DEFAULT_OPTIONS_PATH) {
  const getDefaultOptions = compileDefaultOptionsModule(filePath);
  const options = normalizeNumbers(getDefaultOptions());
  return util.inspect(options, {
    depth: null,
    compact: false,
    breakLength: 80
  });
}

function normalizeNumbers(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeNumbers);
  }

  if (value && typeof value === "object") {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = normalizeNumbers(value[key]);
      return acc;
    }, {});
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const rounded = Number(value.toFixed(12));
    return Number.isInteger(rounded) ? Math.trunc(rounded) : rounded;
  }

  return value;
}

function buildReplacementBlock(optionsText) {
  return `${START_MARKER}\n\n\`\`\`javascript\n${optionsText}\n\`\`\`\n\n${END_MARKER}`;
}

function updateReadmeDefaultOptions({
  readmePath = README_PATH,
  defaultOptionsPath = DEFAULT_OPTIONS_PATH
} = {}) {
  const optionsText = formatDefaultOptions(defaultOptionsPath);
  const replacementBlock = buildReplacementBlock(optionsText);
  const readme = fs.readFileSync(readmePath, "utf8");

  const blockRegex = new RegExp(
    `${START_MARKER}[\\s\\S]*?${END_MARKER}`,
    "m"
  );

  if (!blockRegex.test(readme)) {
    throw new Error(
      `Could not find default options markers (${START_MARKER}, ${END_MARKER}) in README.`
    );
  }

  const updated = readme.replace(blockRegex, replacementBlock);

  if (updated !== readme) {
    fs.writeFileSync(readmePath, updated);
    return true;
  }

  return false;
}

module.exports = {
  updateReadmeDefaultOptions
};

if (require.main === module) {
  try {
    const changed = updateReadmeDefaultOptions();
    if (changed) {
      console.log("README default options section updated.");
    } else {
      console.log("README default options section already up to date.");
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

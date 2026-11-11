import fs from "node:fs";
import { execFileSync } from "node:child_process";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import standaloneCode from "ajv/dist/standalone/index.js";

const spec = JSON.parse(
  fs.readFileSync("../docs/contracts/doctor-api.v0.1.openapi.json", "utf8"),
);
const schemas = JSON.parse(
  JSON.stringify(spec.components.schemas).replaceAll(
    "#/components/schemas/",
    "#/$defs/",
  ),
);
const ajv = new Ajv({
  strict: false,
  allErrors: true,
  code: { source: true, esm: true },
});
addFormats(ajv);
ajv.addSchema({ $id: "doctor", $defs: schemas });
const names = [
  "Session",
  "PatientList",
  "Snapshot",
  "AccessStatus",
  "SharingResolution",
  "FollowupRequest",
  "UpdatesPage",
  "ReviewResult",
  "FollowupRequestInput",
  "ReviewInput",
];
const exports = Object.fromEntries(
  names.map((name) => [name, `doctor#/$defs/${name}`]),
);
fs.writeFileSync(
  "src/lib/api/validators.js",
  "/* Generated from provisional OpenAPI. Run npm run api:types. */\n" +
    standaloneCode(ajv, exports),
);
fs.writeFileSync(
  "src/lib/api/validators.d.ts",
  names
    .map((name) => `export declare const ${name}: (data: unknown) => boolean;`)
    .join("\n") + "\n",
);
fs.rmSync("src/lib/api/contract-schemas.json", { force: true });
execFileSync(
  process.execPath,
  [
    "node_modules/openapi-typescript/bin/cli.js",
    "../docs/contracts/doctor-api.v0.1.openapi.json",
    "-o",
    "src/lib/api/generated.ts",
  ],
  { stdio: "inherit" },
);

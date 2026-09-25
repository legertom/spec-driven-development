import { defineEvalConfig } from "eve/evals";

/** Shared eval defaults. Run with `npm run eve:eval` (local) or `npx eve eval --url https://<deployment>`. */
export default defineEvalConfig({
  timeoutMs: 120_000,
});

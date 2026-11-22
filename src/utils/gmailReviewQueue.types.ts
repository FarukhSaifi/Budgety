import type { StagingRow } from "@utils/importHelpers";

import type { ParsedStatementTransaction } from "@/lib/statement/types";

/** Rows accepted by the sessionStorage review handoff (already staged or freshly parsed). */
export type ReviewStagingIncoming =
  | StagingRow[]
  | ParsedStatementTransaction[]
  | undefined
  | null;

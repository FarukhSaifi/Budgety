import type { DuplicateReason } from "@utils/duplicateDetection";
import type { StagingRow } from "@utils/importHelpers";

export type StagingRowPatch = Partial<
  Pick<StagingRow, "title" | "amount" | "type" | "category" | "paymentMode" | "date">
>;

export interface ImportPreviewRowProps {
  row: StagingRow;
  isDuplicate: boolean;
  duplicateReason?: DuplicateReason | null;
  variant: "table" | "card";
  onToggle: (key: string, selected: boolean) => void;
  /** Patch any staging fields before import (marks row user-overridden). */
  onRowChange: (key: string, patch: StagingRowPatch) => void;
}

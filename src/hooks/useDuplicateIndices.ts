import type { Transaction } from "@/types";
import { filterDuplicates } from "@utils/duplicateDetection";
import {
  prepareRowForDuplicateCheck,
  type StagingRow,
} from "@utils/importHelpers";
import { useMemo } from "react";

/**
 * Indices of staging / parsed rows that duplicate existing Redux transactions
 * (or earlier rows in the same batch) by date + type + amount + description.
 */
export function useDuplicateIndices(
  rows: StagingRow[] | Array<Parameters<typeof prepareRowForDuplicateCheck>[0]>,
  transactions: Transaction[],
): Set<number> {
  return useMemo(() => {
    if (!rows?.length) return new Set<number>();

    const withIndex = rows
      .map((row, i) => ({ prep: prepareRowForDuplicateCheck(row), i }))
      .filter((x) => x.prep != null);

    const prepared = withIndex.map((x) => x.prep!);
    const { duplicates } = filterDuplicates(prepared, transactions);

    return new Set(duplicates.map((d) => withIndex[d.index].i));
  }, [rows, transactions]);
}

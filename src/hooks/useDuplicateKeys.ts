import { useMemo } from "react";

import { filterDuplicates, type DuplicateReason } from "@utils/duplicateDetection";
import { prepareRowForDuplicateCheck, type StagingRow } from "@utils/importHelpers";

import type { Transaction } from "@/types";

export type DuplicateKeyMap = Map<string, DuplicateReason>;

/**
 * Staging row keys that duplicate existing Redux transactions
 * (or earlier rows in the same batch) by date + type + amount + description.
 */
export function useDuplicateKeys(rows: StagingRow[], transactions: Transaction[]): DuplicateKeyMap {
  return useMemo(() => {
    const map: DuplicateKeyMap = new Map();
    if (!rows?.length) return map;

    const withMeta = rows
      .map((row) => ({ prep: prepareRowForDuplicateCheck(row), key: row.key }))
      .filter((x) => x.prep != null);

    const prepared = withMeta.map((x) => x.prep!);
    const { duplicates } = filterDuplicates(prepared, transactions);

    duplicates.forEach((d) => {
      const key = withMeta[d.index]?.key;
      if (key) map.set(key, d.reason);
    });

    return map;
  }, [rows, transactions]);
}

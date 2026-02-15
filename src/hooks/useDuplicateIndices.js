import { filterDuplicates } from "@utils/duplicateDetection";
import { prepareRowForDuplicateCheck } from "@utils/importHelpers";
import { useMemo } from "react";

/**
 * Compute which parsed rows are duplicates of existing transactions.
 * @param {Array} allParsedData - Parsed rows from CSV/Excel/PDF
 * @param {Array} transactions - Existing transactions from context
 * @returns {Set<number>} Set of row indices that are duplicates
 */
export function useDuplicateIndices(allParsedData, transactions) {
  return useMemo(() => {
    if (!allParsedData?.length) return new Set();

    const withIndex = allParsedData
      .map((row, i) => ({ prep: prepareRowForDuplicateCheck(row), i }))
      .filter((x) => x.prep);

    const prepared = withIndex.map((x) => x.prep);
    const { duplicates } = filterDuplicates(prepared, transactions);

    return new Set(duplicates.map((d) => withIndex[d.index].i));
  }, [allParsedData, transactions]);
}

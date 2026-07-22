"use client";

import BankStatementImport from "@components/features/transactions/BankStatementImport";
import { APP_ROUTES } from "@constants/routes";
import { useRouter } from "next/navigation";

export default function TransactionsImportPage() {
  const router = useRouter();

  return (
    <BankStatementImport
      onClose={() => router.push(APP_ROUTES.transactions)}
    />
  );
}

"use client";

import { useRouter } from "next/navigation";

import { APP_ROUTES } from "@constants/routes";

import BankStatementImport from "@components/features/transactions/BankStatementImport";

export default function TransactionsImportPage() {
  const router = useRouter();

  return (
    <BankStatementImport
      onClose={() => router.push(APP_ROUTES.transactions)}
    />
  );
}

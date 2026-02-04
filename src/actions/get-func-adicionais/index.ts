"use server";

import { inArray } from "drizzle-orm";

import { db } from "@/db/index";
import { funcAdicionaisTable } from "@/db/schema";

export type FuncAdicional = {
  employeeId: string;
  hDiaria: string;
  horasExtras: string;
  atrasos: string;
  adNoturno: string;
};

export async function getFuncAdicionaisByEmployeeIds(
  employeeIds: string[],
): Promise<Record<string, FuncAdicional>> {
  if (employeeIds.length === 0) return {};

  const rows = await db
    .select({
      employeeId: funcAdicionaisTable.employeeId,
      hDiaria: funcAdicionaisTable.hDiaria,
      horasExtras: funcAdicionaisTable.horasExtras,
      atrasos: funcAdicionaisTable.atrasos,
      adNoturno: funcAdicionaisTable.adNoturno,
    })
    .from(funcAdicionaisTable)
    .where(inArray(funcAdicionaisTable.employeeId, employeeIds));

  const map: Record<string, FuncAdicional> = {};
  for (const row of rows) {
    map[row.employeeId] = {
      employeeId: row.employeeId,
      hDiaria: row.hDiaria,
      horasExtras: row.horasExtras,
      atrasos: row.atrasos,
      adNoturno: row.adNoturno,
    };
  }
  return map;
}

"use server";

import { and, eq, gte, lt } from "drizzle-orm";

import { db } from "@/db/index";
import { marcacoesPontoTable } from "@/db/schema";

export async function getMarcacoesDia(employeeId: string, date: string) {
  try {
    const [yearStr, monthStr, dayStr] = date.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    const dia = new Date(year, month - 1, day);
    dia.setHours(0, 0, 0, 0);
    const proximoDia = new Date(dia);
    proximoDia.setDate(proximoDia.getDate() + 1);

    const marcacoes = await db
      .select()
      .from(marcacoesPontoTable)
      .where(
        and(
          eq(marcacoesPontoTable.employeeId, employeeId),
          gte(marcacoesPontoTable.dataHora, dia),
          lt(marcacoesPontoTable.dataHora, proximoDia),
        ),
      )
      .orderBy(marcacoesPontoTable.dataHora);

    return { success: true, data: marcacoes };
  } catch (error: unknown) {
    console.error("Erro ao buscar marcações do dia:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao buscar marcações do dia",
      data: [],
    };
  }
}

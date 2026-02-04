"use server";

import { and, eq, gte, lt } from "drizzle-orm";

import { db } from "@/db/index";
import { marcacoesPontoTable } from "@/db/schema";

export async function getMarcacoesMes(
  employeeId: string,
  referenceDate?: string,
) {
  try {
    const base = referenceDate ? new Date(referenceDate) : new Date();
    const inicioMes = new Date(base.getFullYear(), base.getMonth(), 1);
    const inicioProximoMes = new Date(
      base.getFullYear(),
      base.getMonth() + 1,
      1,
    );

    const marcacoes = await db
      .select()
      .from(marcacoesPontoTable)
      .where(
        and(
          eq(marcacoesPontoTable.employeeId, employeeId),
          gte(marcacoesPontoTable.dataHora, inicioMes),
          lt(marcacoesPontoTable.dataHora, inicioProximoMes),
        ),
      )
      .orderBy(marcacoesPontoTable.dataHora);

    return { success: true, data: marcacoes };
  } catch (error: unknown) {
    console.error("Erro ao buscar marcações do mês:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao buscar marcações do mês",
      data: [],
    };
  }
}

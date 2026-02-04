"use server";

import { nanoid } from "nanoid";

import { db } from "@/db/index";
import { employeesTable, marcacoesPontoTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { determineTipoMarcacao } from "@/lib/face-recognition/determine-tipo-marcacao";
import { getMarcacoesDia } from "@/actions/get-marcacoes-dia";
import { recognizeFaceSchema } from "./schema";

const FACE_RECOGNITION_API_URL =
  process.env.FACE_RECOGNITION_API_URL || "http://localhost:8000";

export async function recognizeFace(input: unknown) {
  try {
    const validated = recognizeFaceSchema.parse(input);

    const employees = await db
      .select({
        id: employeesTable.id,
        nome: employeesTable.nome,
        fotoFacialUrl: employeesTable.fotoFacialUrl,
      })
      .from(employeesTable)
      .where(eq(employeesTable.isActive, true));

    const withFacial = employees.filter(
      (e) => e.fotoFacialUrl && e.fotoFacialUrl.trim() !== "",
    );

    if (withFacial.length === 0) {
      return {
        success: false,
        error: "Nenhum funcionário com facial cadastrada encontrado.",
        data: null,
      };
    }

    const colaboradoresData = withFacial.map((e) => ({
      id: e.id,
      nome_completo: e.nome,
      foto_url: e.fotoFacialUrl!,
    }));

    const response = await fetch(
      `${FACE_RECOGNITION_API_URL}/recognize-with-collaborators`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: validated.imageBase64,
          latitude: validated.latitude,
          longitude: validated.longitude,
          dispositivo_info: validated.dispositivoInfo,
          colaboradores: colaboradoresData,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Erro ao processar reconhecimento: ${response.statusText}. ${errorText.slice(0, 200)}`,
        data: null,
      };
    }

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Colaborador não reconhecido",
        data: null,
      };
    }

    const employeeId = result.colaborador_id;
    const nomeCompleto = result.colaborador_nome;

    const hoje = new Date();
    const dateStr = hoje.toISOString().slice(0, 10);
    const marcacoesResult = await getMarcacoesDia(employeeId, dateStr);
    const marcacoesHoje = marcacoesResult.success ? marcacoesResult.data : [];
    const tipo = determineTipoMarcacao(marcacoesHoje);

    const now = new Date();
    const id = nanoid();

    await db.insert(marcacoesPontoTable).values({
      id,
      employeeId,
      tipo,
      dataHora: now,
      descricaoLocal: null,
      terminal: "FACIAL",
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      data: {
        colaborador: { id: employeeId, nomeCompleto },
        tipo,
      },
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Erro ao processar reconhecimento facial";
    return {
      success: false,
      error: message,
      data: null,
    };
  }
}

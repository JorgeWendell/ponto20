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

    let response: Response;
    let timeoutId: NodeJS.Timeout | null = null;
    try {
      // Criar AbortController para timeout
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

      response = await fetch(
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
          signal: controller.signal,
        },
      );

      if (timeoutId) clearTimeout(timeoutId);
    } catch (fetchError) {
      if (timeoutId) clearTimeout(timeoutId);
      const errorMessage =
        fetchError instanceof Error ? fetchError.message : String(fetchError);
      const errorName = fetchError instanceof Error ? fetchError.name : "";

      // Verificar se é erro de abort/timeout
      if (
        errorName === "AbortError" ||
        errorMessage.includes("aborted") ||
        errorMessage.includes("timeout")
      ) {
        return {
          success: false,
          error:
            "Tempo de espera esgotado ao conectar com o serviço de reconhecimento facial.",
          data: null,
        };
      }

      // Verificar se é erro de conexão
      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("fetch failed") ||
        errorMessage.includes("NetworkError") ||
        errorMessage.includes("ERR_CONNECTION_REFUSED") ||
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("ECONNRESET") ||
        errorMessage.includes("ENOTFOUND") ||
        errorMessage.includes("getaddrinfo ENOTFOUND")
      ) {
        return {
          success: false,
          error: `Serviço de reconhecimento facial não está disponível em ${FACE_RECOGNITION_API_URL}. Verifique se o serviço está rodando e acessível.`,
          data: null,
        };
      }

      // Outros erros de fetch
      return {
        success: false,
        error: `Erro ao conectar com o serviço de reconhecimento facial: ${errorMessage}`,
        data: null,
      };
    }

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

    // Verificar se é erro de conexão no catch geral também
    if (
      message.includes("Failed to fetch") ||
      message.includes("fetch failed") ||
      message.includes("NetworkError") ||
      message.includes("ERR_CONNECTION_REFUSED") ||
      message.includes("ECONNREFUSED") ||
      message.includes("ECONNRESET") ||
      message.includes("ENOTFOUND") ||
      message.includes("getaddrinfo ENOTFOUND")
    ) {
      return {
        success: false,
        error: `Serviço de reconhecimento facial não está disponível em ${FACE_RECOGNITION_API_URL}. Verifique se o serviço está rodando e acessível.`,
        data: null,
      };
    }

    return {
      success: false,
      error: message,
      data: null,
    };
  }
}

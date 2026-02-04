type MarcacaoHoje = {
  tipo: "ENTRADA" | "SAIDA" | "ENTRADA_ALMOCO" | "VOLTA_ALMOCO";
};

/**
 * Determina o tipo de marcação baseado nas marcações existentes do dia.
 * Sequência: ENTRADA -> ENTRADA_ALMOCO -> VOLTA_ALMOCO -> SAIDA.
 */
export function determineTipoMarcacao(
  marcacoesHoje: MarcacaoHoje[],
): "ENTRADA" | "SAIDA" | "ENTRADA_ALMOCO" | "VOLTA_ALMOCO" {
  const temEntrada = marcacoesHoje.some((m) => m.tipo === "ENTRADA");
  const temEntradaAlmoco = marcacoesHoje.some(
    (m) => m.tipo === "ENTRADA_ALMOCO",
  );
  const temVoltaAlmoco = marcacoesHoje.some((m) => m.tipo === "VOLTA_ALMOCO");
  const temSaida = marcacoesHoje.some((m) => m.tipo === "SAIDA");

  if (!temEntrada) return "ENTRADA";
  if (temEntrada && !temEntradaAlmoco) return "ENTRADA_ALMOCO";
  if (temEntradaAlmoco && !temVoltaAlmoco) return "VOLTA_ALMOCO";
  if (temEntrada && !temSaida) return "SAIDA";

  return "ENTRADA";
}

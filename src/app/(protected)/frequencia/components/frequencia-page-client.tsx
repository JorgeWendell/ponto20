"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Download, MoreHorizontal } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMarcacoesMes } from "@/actions/get-marcacoes-mes";

type FrequenciaCollaborator = {
  id: string;
  nome: string;
  cargo?: string | null;
  equipe?: string | null;
  departamentoId?: string | null;
  avatarUrl: string | null;
};

type Departamento = {
  id: string;
  nome: string;
};

const getStatusDotClass = (_pendencias: number) => {
  return "bg-emerald-500";
};

const formatDuration = (totalMinutes: number) => {
  const abs = Math.abs(totalMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return `${hours}h ${minutes.toString().padStart(2, "0")}min`;
};

type Marcação = {
  id: string;
  tipo: string;
  dataHora: Date | string;
  descricaoLocal?: string | null;
  terminal?: string | null;
};

type FuncAdicional = {
  employeeId: string;
  hDiaria: string;
  horasExtras: string;
  atrasos: string;
  adNoturno: string;
};

type FrequenciaPageClientProps = {
  colaboradores: FrequenciaCollaborator[];
  marcacoesPorColaborador: Record<string, Marcação[]>;
  funcAdicionaisPorColaborador: Record<string, FuncAdicional>;
  selectedDate: string;
  departamentos: Departamento[];
};

export function FrequenciaPageClient({
  colaboradores,
  marcacoesPorColaborador,
  funcAdicionaisPorColaborador,
  selectedDate,
  departamentos,
}: FrequenciaPageClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(colaboradores[0]?.id ?? "");
  const [tab, setTab] = useState("resumo");
  const [historicoMes, setHistoricoMes] = useState<Record<string, Marcação[]>>(
    {},
  );
  const [isLoadingHistorico, setIsLoadingHistorico] = useState(false);
  const [dateValue, setDateValue] = useState<string>(selectedDate);
  const [selectedDepartamentoId, setSelectedDepartamentoId] =
    useState<string>("todos");
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedColaboradoresIds, setSelectedColaboradoresIds] = useState<
    Set<string>
  >(new Set());

  const colaboradoresFiltrados = useMemo(() => {
    let filtered = colaboradores;

    if (selectedDepartamentoId !== "todos") {
      filtered = filtered.filter(
        (c) => c.departamentoId === selectedDepartamentoId,
      );
    }

    if (search.trim()) {
      const term = search.toLowerCase();
      filtered = filtered.filter((c) => c.nome.toLowerCase().includes(term));
    }

    return filtered;
  }, [search, colaboradores, selectedDepartamentoId]);

  useEffect(() => {
    const estaNaListaFiltrada = colaboradoresFiltrados.some(
      (c) => c.id === selectedId,
    );

    if (!estaNaListaFiltrada && colaboradoresFiltrados.length > 0) {
      setSelectedId(colaboradoresFiltrados[0].id);
    } else if (colaboradoresFiltrados.length === 0) {
      setSelectedId("");
    }
  }, [colaboradoresFiltrados, selectedId]);

  const colaboradorSelecionado =
    colaboradoresFiltrados.find((c) => c.id === selectedId) ??
    colaboradoresFiltrados[0] ??
    null;

  const marcacoesSelecionado =
    (colaboradorSelecionado &&
      marcacoesPorColaborador[colaboradorSelecionado.id]) ||
    [];

  const historicoSelecionado =
    (colaboradorSelecionado && historicoMes[colaboradorSelecionado.id]) || [];

  const formatTipo = (tipo: string) => {
    switch (tipo) {
      case "ENTRADA":
        return "Entrada";
      case "ENTRADA_ALMOCO":
        return "Saída almoço";
      case "VOLTA_ALMOCO":
        return "Retorno almoço";
      case "SAIDA":
        return "Saída";
      default:
        return tipo;
    }
  };

  const resumoDia = useMemo(() => {
    if (!marcacoesSelecionado || marcacoesSelecionado.length === 0) {
      return {
        horasTrabalhadas: "0h 00min",
        atrasos: 0,
        bancoHoras: "0h 00min",
      };
    }

    const marcacoesOrdenadas = [...marcacoesSelecionado].sort(
      (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime(),
    );

    const entrada = marcacoesOrdenadas.find((m) => m.tipo === "ENTRADA");
    const saida = [...marcacoesOrdenadas]
      .reverse()
      .find((m) => m.tipo === "SAIDA");

    const entradaAlmoco = marcacoesOrdenadas.find(
      (m) => m.tipo === "ENTRADA_ALMOCO",
    );
    const voltaAlmoco = marcacoesOrdenadas.find(
      (m) => m.tipo === "VOLTA_ALMOCO",
    );

    let totalMs = 0;

    if (entrada && saida) {
      const inicio = new Date(entrada.dataHora).getTime();
      const fim = new Date(saida.dataHora).getTime();
      if (fim > inicio) {
        totalMs += fim - inicio;
      }
    }

    if (entradaAlmoco && voltaAlmoco) {
      const inicioAlmoco = new Date(entradaAlmoco.dataHora).getTime();
      const fimAlmoco = new Date(voltaAlmoco.dataHora).getTime();
      if (fimAlmoco > inicioAlmoco) {
        totalMs -= fimAlmoco - inicioAlmoco;
      }
    }

    const totalMinutes = Math.max(0, Math.round(totalMs / 60000));

    const atrasos = marcacoesOrdenadas.filter((m) => {
      if (m.tipo !== "ENTRADA") return false;
      const d = new Date(m.dataHora);
      const h = d.getHours();
      const min = d.getMinutes();
      return h > 8 || (h === 8 && min > 0);
    }).length;

    const esperadoPorDiaMin = 8 * 60;
    const delta = totalMinutes - esperadoPorDiaMin;
    const bancoLabel =
      delta === 0
        ? "0h 00min"
        : `${delta > 0 ? "+" : "-"}${formatDuration(delta)}`;

    return {
      horasTrabalhadas: formatDuration(totalMinutes),
      atrasos,
      bancoHoras: bancoLabel,
    };
  }, [marcacoesSelecionado]);

  useEffect(() => {
    const carregarHistoricoMes = async () => {
      if (tab !== "historico" || !colaboradorSelecionado) return;
      const id = colaboradorSelecionado.id;
      if (historicoMes[id]) return;

      try {
        setIsLoadingHistorico(true);
        const res = await getMarcacoesMes(id, dateValue);
        if (res.success) {
          setHistoricoMes((prev) => ({
            ...prev,
            [id]: res.data,
          }));
        }
      } catch (error) {
        console.error("Erro ao carregar histórico do mês:", error);
      } finally {
        setIsLoadingHistorico(false);
      }
    };

    void carregarHistoricoMes();
  }, [tab, colaboradorSelecionado, dateValue, historicoMes]);

  const selectedDateLabel = useMemo(() => {
    if (!dateValue) return "";
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("pt-BR");
  }, [dateValue]);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setDateValue(value);
    if (value) {
      router.push(`/frequencia?data=${value}`);
    }
  };

  const calcularResumoColaborador = (
    marcacoes: Marcação[],
  ): {
    horasTrabalhadas: string;
    atrasos: number;
    bancoHoras: string;
  } => {
    if (!marcacoes || marcacoes.length === 0) {
      return {
        horasTrabalhadas: "0h 00min",
        atrasos: 0,
        bancoHoras: "0h 00min",
      };
    }

    const marcacoesOrdenadas = [...marcacoes].sort(
      (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime(),
    );

    const entrada = marcacoesOrdenadas.find((m) => m.tipo === "ENTRADA");
    const saida = [...marcacoesOrdenadas]
      .reverse()
      .find((m) => m.tipo === "SAIDA");
    const entradaAlmoco = marcacoesOrdenadas.find(
      (m) => m.tipo === "ENTRADA_ALMOCO",
    );
    const voltaAlmoco = marcacoesOrdenadas.find(
      (m) => m.tipo === "VOLTA_ALMOCO",
    );

    let totalMs = 0;
    if (entrada && saida) {
      const inicio = new Date(entrada.dataHora).getTime();
      const fim = new Date(saida.dataHora).getTime();
      if (fim > inicio) totalMs += fim - inicio;
    }
    if (entradaAlmoco && voltaAlmoco) {
      const inicioAlmoco = new Date(entradaAlmoco.dataHora).getTime();
      const fimAlmoco = new Date(voltaAlmoco.dataHora).getTime();
      if (fimAlmoco > inicioAlmoco) totalMs -= fimAlmoco - inicioAlmoco;
    }

    const totalMinutes = Math.max(0, Math.round(totalMs / 60000));
    const atrasos = marcacoesOrdenadas.filter((m) => {
      if (m.tipo !== "ENTRADA") return false;
      const d = new Date(m.dataHora);
      return d.getHours() > 8 || (d.getHours() === 8 && d.getMinutes() > 0);
    }).length;
    const esperadoPorDiaMin = 8 * 60;
    const delta = totalMinutes - esperadoPorDiaMin;
    const bancoLabel =
      delta === 0
        ? "0h 00min"
        : `${delta > 0 ? "+" : "-"}${formatDuration(delta)}`;

    return {
      horasTrabalhadas: formatDuration(totalMinutes),
      atrasos,
      bancoHoras: bancoLabel,
    };
  };

  const handleExport = async () => {
    if (selectedColaboradoresIds.size === 0) return;

    try {
      const XLSX = await import("xlsx");

      const colaboradoresParaExportar = colaboradoresFiltrados.filter((c) =>
        selectedColaboradoresIds.has(c.id),
      );

      const dadosExportacao = colaboradoresParaExportar.map((colaborador) => {
        const marcacoes = marcacoesPorColaborador[colaborador.id] || [];
        const resumo = calcularResumoColaborador(marcacoes);
        const marcacoesFormatadas = marcacoes
          .map((m) => {
            const dataHora = new Date(m.dataHora);
            return `${formatTipo(m.tipo)}: ${dataHora.toLocaleTimeString(
              "pt-BR",
              {
                hour: "2-digit",
                minute: "2-digit",
              },
            )}`;
          })
          .join("; ");

        return {
          Nome: colaborador.nome,
          Cargo: colaborador.cargo || "",
          Equipe: colaborador.equipe || "",
          "Horas Trabalhadas": resumo.horasTrabalhadas,
          Atrasos: resumo.atrasos,
          "Banco de Horas": resumo.bancoHoras,
          Marcações: marcacoesFormatadas || "Sem marcações",
        };
      });

      const wb = XLSX.utils.book_new();
      const wsResumo = XLSX.utils.json_to_sheet(dadosExportacao);
      const colWidthsResumo = [
        { wch: 30 },
        { wch: 20 },
        { wch: 20 },
        { wch: 18 },
        { wch: 10 },
        { wch: 15 },
        { wch: 50 },
      ];
      wsResumo["!cols"] = colWidthsResumo;
      XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

      for (const colaborador of colaboradoresParaExportar) {
        const marcacoes = marcacoesPorColaborador[colaborador.id] || [];
        const funcAdicional = funcAdicionaisPorColaborador[colaborador.id];
        const horaDiaria = funcAdicional?.hDiaria ?? "";
        const he = funcAdicional?.horasExtras ?? "";
        const atrasosAdic = funcAdicional?.atrasos ?? "";
        const an = funcAdicional?.adNoturno ?? "";

        const marcacoesPorData: Record<string, Marcação[]> = {};
        marcacoes.forEach((m) => {
          const dataHora = new Date(m.dataHora);
          const dataKey = dataHora.toLocaleDateString("pt-BR");
          if (!marcacoesPorData[dataKey]) marcacoesPorData[dataKey] = [];
          marcacoesPorData[dataKey].push(m);
        });

        const dadosFuncionario = Object.entries(marcacoesPorData)
          .sort(([dataA], [dataB]) => {
            const dateA = new Date(dataA.split("/").reverse().join("-"));
            const dateB = new Date(dataB.split("/").reverse().join("-"));
            return dateA.getTime() - dateB.getTime();
          })
          .map(([data, marcacoesDia]) => {
            const marcacoesOrdenadas = [...marcacoesDia].sort(
              (a, b) =>
                new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime(),
            );
            const entrada = marcacoesOrdenadas.find(
              (m) => m.tipo === "ENTRADA",
            );
            const entradaAlmoco = marcacoesOrdenadas.find(
              (m) => m.tipo === "ENTRADA_ALMOCO",
            );
            const voltaAlmoco = marcacoesOrdenadas.find(
              (m) => m.tipo === "VOLTA_ALMOCO",
            );
            const saida = marcacoesOrdenadas.find((m) => m.tipo === "SAIDA");
            const formatarHora = (marcacao: Marcação | undefined) => {
              if (!marcacao) return "";
              return new Date(marcacao.dataHora).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });
            };
            return {
              Nome: colaborador.nome,
              Data: data,
              Entrada: formatarHora(entrada),
              "Entrada Almoço": formatarHora(entradaAlmoco),
              "Volta Almoço": formatarHora(voltaAlmoco),
              Saída: formatarHora(saida),
              "Hora Diária": horaDiaria,
              "H.E": he,
              Atrasos: atrasosAdic,
              "A.N": an,
            };
          });

        if (dadosFuncionario.length === 0) {
          dadosFuncionario.push({
            Nome: colaborador.nome,
            Data: dateValue
              ? new Date(dateValue).toLocaleDateString("pt-BR")
              : new Date().toLocaleDateString("pt-BR"),
            Entrada: "",
            "Entrada Almoço": "",
            "Volta Almoço": "",
            Saída: "",
            "Hora Diária": horaDiaria,
            "H.E": he,
            Atrasos: atrasosAdic,
            "A.N": an,
          });
        }

        const wsFuncionario = XLSX.utils.json_to_sheet(dadosFuncionario);
        wsFuncionario["!cols"] = [
          { wch: 30 },
          { wch: 12 },
          { wch: 12 },
          { wch: 15 },
          { wch: 15 },
          { wch: 12 },
          { wch: 12 },
          { wch: 10 },
          { wch: 12 },
          { wch: 10 },
        ];
        const nomeAba =
          colaborador.nome.length > 31
            ? colaborador.nome.substring(0, 31)
            : colaborador.nome;
        XLSX.utils.book_append_sheet(wb, wsFuncionario, nomeAba);
      }

      const dataFormatada = dateValue
        ? new Date(dateValue).toLocaleDateString("pt-BR").replace(/\//g, "-")
        : new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
      XLSX.writeFile(wb, `frequencia_${dataFormatada}.xlsx`);

      setIsExportDialogOpen(false);
      setSelectedColaboradoresIds(new Set());
    } catch (err) {
      console.error("Erro ao exportar:", err);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedColaboradoresIds(
        new Set(colaboradoresFiltrados.map((c) => c.id)),
      );
    } else {
      setSelectedColaboradoresIds(new Set());
    }
  };

  const handleToggleColaborador = (id: string, checked: boolean) => {
    const newSet = new Set(selectedColaboradoresIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedColaboradoresIds(newSet);
  };

  const todosSelecionados =
    colaboradoresFiltrados.length > 0 &&
    colaboradoresFiltrados.every((c) => selectedColaboradoresIds.has(c.id));
  const algunsSelecionados =
    selectedColaboradoresIds.size > 0 &&
    selectedColaboradoresIds.size < colaboradoresFiltrados.length;

  return (
    <div className="flex h-full flex-col space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-foreground text-3xl font-semibold">
            Gestão de Frequência
          </h1>
          <p className="text-muted-foreground text-sm">
            Controle e análise de marcações de ponto
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-background flex items-center gap-2 rounded-lg border border-dashed px-3 py-1.5 text-xs md:text-sm">
            <CalendarDays className="h-4 w-4" />
            <input
              type="date"
              value={dateValue}
              onChange={handleDateChange}
              className="border-0 bg-transparent p-0 text-xs outline-none focus-visible:outline-none md:text-sm"
            />
          </div>
          <Select
            value={selectedDepartamentoId}
            onValueChange={setSelectedDepartamentoId}
          >
            <SelectTrigger className="h-9 w-[180px] rounded-lg text-xs md:text-sm">
              <SelectValue placeholder="Todos os cargos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os cargos</SelectItem>
              {departamentos.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select defaultValue="todas-ocorrencias">
            <SelectTrigger className="h-9 w-[160px] rounded-lg text-xs md:text-sm">
              <SelectValue placeholder="Todas ocorrências" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas-ocorrencias">
                Todas ocorrências
              </SelectItem>
              <SelectItem value="atrasos">Atrasos</SelectItem>
              <SelectItem value="faltas">Faltas</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => setIsExportDialogOpen(true)}
            className="bg-foreground text-background hover:bg-foreground/90 h-9 gap-2 rounded-lg px-4 text-xs md:text-sm"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-3 gap-6">
        <Card className="flex min-h-0 flex-col">
          <div className="col-span-2 border-b px-4 pt-3 pb-3">
            <Input
              placeholder="Buscar colaborador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-full text-sm"
            />
          </div>
          <CardContent className="min-h-0 flex-1 overflow-y-auto px-0 pb-0">
            <div className="space-y-1 pt-1">
              {colaboradoresFiltrados.map((colaborador) => (
                <button
                  key={colaborador.id}
                  type="button"
                  onClick={() => setSelectedId(colaborador.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                    colaboradorSelecionado?.id === colaborador.id
                      ? "bg-muted"
                      : "hover:bg-muted/60"
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={colaborador.avatarUrl ?? undefined} />
                      <AvatarFallback>
                        {colaborador.nome
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`border-background absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 ${getStatusDotClass(0)}`}
                    />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-foreground text-sm font-medium">
                      {colaborador.nome}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="col-span-2 flex min-h-0 flex-1 flex-col gap-4">
          <Card className="flex-1">
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={colaboradorSelecionado?.avatarUrl ?? undefined}
                  />
                  <AvatarFallback>
                    {colaboradorSelecionado?.nome
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-foreground text-base font-semibold">
                      {colaboradorSelecionado?.nome ||
                        "Selecione um colaborador"}
                    </p>
                    {colaboradorSelecionado?.cargo && (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300"
                      >
                        {colaboradorSelecionado.cargo}
                      </Badge>
                    )}
                    {colaboradorSelecionado?.equipe && (
                      <Badge
                        variant="outline"
                        className="border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300"
                      >
                        {colaboradorSelecionado.equipe}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Timeline de marcações · {selectedDateLabel}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="bg-muted mb-4 h-9 rounded-full px-1">
                  <TabsTrigger
                    value="resumo"
                    className="h-7 rounded-full px-3 text-xs md:px-4 md:text-sm"
                  >
                    Resumo do dia
                  </TabsTrigger>
                  <TabsTrigger
                    value="historico"
                    className="h-7 rounded-full px-3 text-xs md:px-4 md:text-sm"
                  >
                    Histórico do mês
                  </TabsTrigger>
                  <TabsTrigger
                    value="tratativas"
                    className="h-7 rounded-full px-3 text-xs md:px-4 md:text-sm"
                  >
                    Tratativas
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="resumo" className="space-y-4">
                  <div className="space-y-4">
                    {marcacoesSelecionado.map((marcacao) => (
                      <div key={marcacao.id} className="relative flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-3 w-3 rounded-full border-2 border-emerald-500 bg-emerald-500" />
                          <div className="bg-border mt-1 h-full w-px flex-1" />
                        </div>
                        <Card className="border-border/70 bg-muted/40 flex-1 border">
                          <CardContent className="flex items-center justify-between gap-4 py-3">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-foreground text-sm font-medium">
                                  {formatTipo(marcacao.tipo)}
                                </span>
                                <span className="text-foreground text-sm font-semibold">
                                  {new Date(
                                    marcacao.dataHora,
                                  ).toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
                                <span>{marcacao.descricaoLocal ?? "—"}</span>
                                <span>·</span>
                                <span>{marcacao.terminal ?? "—"}</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:bg-muted rounded-full text-xs"
                            >
                              Ver detalhes
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                    {marcacoesSelecionado.length === 0 && (
                      <p className="text-muted-foreground text-sm">
                        Nenhuma marcação registrada para este dia.
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="historico" className="space-y-4">
                  {isLoadingHistorico && (
                    <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
                      Carregando histórico do mês...
                    </div>
                  )}

                  {!isLoadingHistorico && historicoSelecionado.length === 0 && (
                    <div className="text-muted-foreground flex items-center justify-center rounded-lg border border-dashed py-10 text-sm">
                      Nenhuma marcação encontrada no mês atual.
                    </div>
                  )}

                  {!isLoadingHistorico && historicoSelecionado.length > 0 && (
                    <div className="space-y-4">
                      {Object.entries(
                        historicoSelecionado.reduce(
                          (acc: Record<string, Marcação[]>, marcacao) => {
                            const d = new Date(marcacao.dataHora);
                            const key = d.toLocaleDateString("pt-BR");
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(marcacao);
                            return acc;
                          },
                          {},
                        ),
                      ).map(([data, marcacoes]) => (
                        <div key={data} className="space-y-2">
                          <p className="text-foreground text-sm font-semibold">
                            {data}
                          </p>
                          <div className="space-y-2">
                            {marcacoes.map((m) => (
                              <div
                                key={m.id}
                                className="bg-muted/40 flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                              >
                                <span>{formatTipo(m.tipo)}</span>
                                <span className="font-medium">
                                  {new Date(m.dataHora).toLocaleTimeString(
                                    "pt-BR",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="tratativas">
                  <div className="text-muted-foreground flex items-center justify-center rounded-lg border border-dashed py-10 text-sm">
                    Em breve: registro e acompanhamento de tratativas.
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card className="border-emerald-100 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-900/10">
                  <CardContent className="flex flex-col gap-1 py-3">
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      Horas trabalhadas
                    </span>
                    <span className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">
                      {resumoDia.horasTrabalhadas}
                    </span>
                  </CardContent>
                </Card>
                <Card className="border-orange-100 bg-orange-50/60 dark:border-orange-900/40 dark:bg-orange-900/10">
                  <CardContent className="flex flex-col gap-1 py-3">
                    <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                      Atrasos
                    </span>
                    <span className="text-xl font-semibold text-orange-900 dark:text-orange-100">
                      {resumoDia.atrasos} ocorrência
                      {resumoDia.atrasos === 1 ? "" : "s"}
                    </span>
                  </CardContent>
                </Card>
                <Card className="border-sky-100 bg-sky-50/60 dark:border-sky-900/40 dark:bg-sky-900/10">
                  <CardContent className="flex flex-col gap-1 py-3">
                    <span className="text-xs font-medium text-sky-700 dark:text-sky-300">
                      Banco de horas
                    </span>
                    <span className="text-xl font-semibold text-sky-900 dark:text-sky-100">
                      {resumoDia.bancoHoras}
                    </span>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col">
          <DialogHeader>
            <DialogTitle>Selecionar Funcionários para Exportar</DialogTitle>
            <DialogDescription>
              Selecione os funcionários que deseja incluir na exportação. Apenas
              os funcionários marcados serão exportados.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-2 overflow-y-auto rounded-lg border p-4">
            <div className="bg-background sticky top-0 z-10 flex items-center gap-3 border-b px-2 py-2">
              <Checkbox
                checked={todosSelecionados}
                onCheckedChange={handleSelectAll}
              />
              <label className="flex-1 cursor-pointer text-sm font-semibold">
                Selecionar Todos ({colaboradoresFiltrados.length})
              </label>
            </div>

            {colaboradoresFiltrados.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                Nenhum funcionário encontrado com os filtros aplicados.
              </p>
            ) : (
              colaboradoresFiltrados.map((colaborador) => (
                <div
                  key={colaborador.id}
                  className="hover:bg-muted/50 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
                >
                  <Checkbox
                    checked={selectedColaboradoresIds.has(colaborador.id)}
                    onCheckedChange={(checked) =>
                      handleToggleColaborador(colaborador.id, checked === true)
                    }
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={colaborador.avatarUrl ?? undefined} />
                    <AvatarFallback>
                      {colaborador.nome
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-medium">
                      {colaborador.nome}
                    </p>
                    <div className="mt-0.5 flex gap-2">
                      {colaborador.cargo && (
                        <span className="text-muted-foreground text-xs">
                          {colaborador.cargo}
                        </span>
                      )}
                      {colaborador.equipe && (
                        <>
                          {colaborador.cargo && (
                            <span className="text-muted-foreground text-xs">
                              ·
                            </span>
                          )}
                          <span className="text-muted-foreground text-xs">
                            {colaborador.equipe}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsExportDialogOpen(false);
                setSelectedColaboradoresIds(new Set());
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              disabled={selectedColaboradoresIds.size === 0}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar ({selectedColaboradoresIds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

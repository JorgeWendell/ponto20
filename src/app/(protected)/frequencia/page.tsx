import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getEmployeesAction } from "@/actions/get-employees";
import { getFuncAdicionaisByEmployeeIds } from "@/actions/get-func-adicionais";
import { getJobsAction } from "@/actions/get-jobs";
import { getMarcacoesDia } from "@/actions/get-marcacoes-dia";

import { FrequenciaPageClient } from "./components/frequencia-page-client";

export const dynamic = "force-dynamic";

export default async function FrequenciaPage({
  searchParams,
}: {
  searchParams?: Promise<{ data?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/login");
  }

  const today = new Date();
  const defaultDate = today.toISOString().slice(0, 10);
  const params = await searchParams;
  const selectedDate = params?.data ?? defaultDate;

  const [employeesResult, jobsResult] = await Promise.all([
    getEmployeesAction({}),
    getJobsAction({}),
  ]);

  const employeesRaw = employeesResult?.data?.data ?? [];
  const employees = employeesRaw
    .filter((e) => e.isActive)
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((emp) => ({
      id: emp.id,
      nome: emp.nome,
      cargo: emp.jobNome ?? null,
      equipe: emp.locationNome ?? null,
      departamentoId: emp.jobId ?? null,
      avatarUrl: null,
    }));

  const jobsData = jobsResult?.data?.data ?? [];
  const cargos = jobsData.map((j) => ({ id: j.id, nome: j.nome }));

  const [marcacoesEntries, funcAdicionaisMap] = await Promise.all([
    Promise.all(
      employees.map(async (emp) => {
        const res = await getMarcacoesDia(emp.id, selectedDate);
        return [emp.id, res.success ? res.data : []] as const;
      }),
    ),
    getFuncAdicionaisByEmployeeIds(employees.map((e) => e.id)),
  ]);
  const marcacoesPorColaborador = Object.fromEntries(marcacoesEntries);

  return (
    <FrequenciaPageClient
      colaboradores={employees}
      marcacoesPorColaborador={marcacoesPorColaborador}
      funcAdicionaisPorColaborador={funcAdicionaisMap}
      selectedDate={selectedDate}
      departamentos={cargos}
    />
  );
}

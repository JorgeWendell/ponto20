import { JobForm } from "./components/job-form";
import { JobsTable } from "./components/jobs-table";

export default function GestaoCargosPage() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestão de Cargos
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Cadastre e gerencie os cargos da organização
          </p>
        </div>
        <JobForm />
      </div>
      <JobsTable />
    </div>
  );
}

import { ScheduleForm } from "./components/schedule-form";
import { SchedulesTable } from "./components/schedules-table";

export default function GestaoHorariosPage() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestão de Horários
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Cadastre e gerencie os horários de trabalho
          </p>
        </div>
        <ScheduleForm />
      </div>
      <SchedulesTable />
    </div>
  );
}

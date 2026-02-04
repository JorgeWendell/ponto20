import { FacialForm } from "./components/facial-form";
import { FaciaisTable } from "./components/faciais-table";

export default function CadastroFacialPage() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cadastro de Facial
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Cadastre e gerencie as fotos faciais dos funcionários
          </p>
        </div>
        <FacialForm />
      </div>
      <FaciaisTable />
    </div>
  );
}

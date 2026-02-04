import { FuncionarioForm } from "./components/funcionario-form";
import { FuncionariosTable } from "./components/funcionarios-table";

export default function CadastroFuncionariosPage() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cadastro de Funcionários
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Cadastre e gerencie os funcionários da organização
          </p>
        </div>
        <FuncionarioForm />
      </div>
      <FuncionariosTable />
    </div>
  );
}

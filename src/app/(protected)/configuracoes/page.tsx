import Link from "next/link";
import {
  Users,
  Shield,
  Briefcase,
  UserCircle2,
  Clock,
  ChevronRight,
  MapPin,
  ScanFace,
} from "lucide-react";

export default function ConfiguracoesPage() {
  return (
    <div className="p-6">
      <div className="space-y-3">
        <Link
          href="/configuracoes/gestao-usuarios"
          className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Gestão de usuários
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gerencie usuários, perfis e acessos ao sistema
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </Link>

        <Link
          href="/configuracoes/gestao-permissoes"
          className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
            <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Gestão de permissões
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure permissões e níveis de acesso por usuário
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </Link>

        <Link
          href="/configuracoes/gestao-cargos"
          className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Briefcase className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Gestão de Cargos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gerencie cargos, funções e hierarquias organizacionais
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </Link>

        <Link
          href="/configuracoes/cadastro-funcionarios"
          className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <UserCircle2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Cadastro de Funcionários
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cadastre e gerencie os funcionários da organização
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </Link>

        <Link
          href="/configuracoes/cadastro-facial"
          className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <ScanFace className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Cadastro de Facial
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cadastre e gerencie as fotos faciais dos funcionários
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </Link>

        <Link
          href="/configuracoes/cadastro-locais"
          className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
            <MapPin className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Cadastro de Locais
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gerencie o cadastro de locais e endereços
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </Link>

        <Link
          href="/configuracoes/gestao-horarios"
          className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/30">
            <Clock className="h-6 w-6 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Gestão de Horários
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cadastre e gerencie os horários de trabalho
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { SuporteForm } from "./suporte-form";
import { ChamadosTable } from "./chamados-table";

type SuportePageClientProps = {
  userId: string;
  userName: string;
  userEmail: string;
};

export function SuportePageClient({
  userId,
  userName,
  userEmail,
}: SuportePageClientProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Suporte
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Abra um chamado para reportar problemas ou tirar dúvidas
          </p>
        </div>
        <SuporteForm
          userId={userId}
          userName={userName}
          userEmail={userEmail}
          onSuccess={() => setRefreshTrigger((n) => n + 1)}
        />
      </div>
      <div>
        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Meus chamados
        </h3>
        <ChamadosTable userId={userId} refreshTrigger={refreshTrigger} />
      </div>
    </>
  );
}

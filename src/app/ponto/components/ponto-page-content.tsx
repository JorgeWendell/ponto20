"use client";

import { PontoHeader } from "./ponto-header";
import { CameraArea } from "./camera-area";
import { PontoFooter } from "./ponto-footer";

export function PontoPageContent() {
  return (
    <div className="flex min-h-[100dvh] min-h-screen flex-col bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <PontoHeader />

      <main className="flex flex-1 items-center justify-center p-4 pb-24 sm:p-6 md:p-8 md:pb-8">
        <CameraArea />
      </main>

      <PontoFooter />
    </div>
  );
}

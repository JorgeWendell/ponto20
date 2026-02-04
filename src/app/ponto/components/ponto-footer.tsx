"use client";

import Link from "next/link";
import { Clock, History, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PontoFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white [padding-bottom:env(safe-area-inset-bottom)] md:hidden dark:border-gray-700 dark:bg-gray-900">
      <nav className="flex justify-around px-2 py-3 sm:px-4">
        <Button
          variant="ghost"
          className="min-h-[44px] min-w-[44px] flex-1 flex-col items-center gap-1 py-3 sm:py-2"
          asChild
        >
          <Link href="/ponto" className="flex flex-col items-center gap-1">
            <Clock className="h-6 w-6 sm:h-5 sm:w-5" />
            <span className="text-xs">Registrar ponto</span>
          </Link>
        </Button>

        <Button
          variant="ghost"
          className="min-h-[44px] min-w-[44px] flex-1 flex-col items-center gap-1 py-3 sm:py-2"
          asChild
        >
          <Link href="/login" className="flex flex-col items-center gap-1">
            <History className="h-6 w-6 sm:h-5 sm:w-5" />
            <span className="text-xs">Histórico</span>
          </Link>
        </Button>

        <Button
          variant="ghost"
          className="min-h-[44px] min-w-[44px] flex-1 flex-col items-center gap-1 py-3 sm:py-2"
          asChild
        >
          <Link href="/login" className="flex flex-col items-center gap-1">
            <Phone className="h-6 w-6 sm:h-5 sm:w-5" />
            <span className="text-xs">Suporte</span>
          </Link>
        </Button>
      </nav>
    </footer>
  );
}

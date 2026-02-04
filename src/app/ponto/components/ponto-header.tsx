"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function PontoHeader() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedTime = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(currentTime);

  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(currentTime);

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 [padding-right:max(1rem,env(safe-area-inset-right))] [padding-left:max(1rem,env(safe-area-inset-left))] sm:px-6 md:px-8 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <Image
          src="/logo2.png"
          alt="Meu Ponto"
          width={150}
          height={150}
          className="h-16 w-16 object-contain sm:h-20 sm:w-20"
        />
      </div>

      <div className="flex flex-col items-end">
        <div className="text-xl font-semibold text-gray-900 sm:text-2xl md:text-3xl dark:text-gray-100">
          {formattedTime}
        </div>
        <div className="text-xs text-gray-600 capitalize sm:text-sm md:text-base dark:text-gray-400">
          {formattedDate}
        </div>
      </div>
    </header>
  );
}

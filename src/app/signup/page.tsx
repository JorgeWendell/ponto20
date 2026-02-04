import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/lib/auth";

import { SignupForm } from "./components/signup-form";

function SignupFormWrapper() {
  return <SignupForm />;
}

export default async function SignupPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="dark relative flex min-h-screen">
      <div className="absolute inset-0 scale-100">
        <Image
          src="/screen2.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="relative z-10 hidden w-1/2 flex-col justify-between p-12 lg:flex">
        <div>
          <div className="mb-8 flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Logo"
              width={200}
              height={200}
              priority
              unoptimized
            />
          </div>
        </div>
      </div>
      <div className="relative z-10 flex w-full items-center justify-center p-8 lg:w-1/2">
        <Suspense fallback={<div className="text-white">Carregando...</div>}>
          <SignupFormWrapper />
        </Suspense>
      </div>
    </div>
  );
}

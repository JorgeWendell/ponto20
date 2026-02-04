import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { Toaster } from "sonner";

import { auth } from "@/lib/auth";
import { db } from "@/db/index";
import { jobUsersTable, jobTable } from "@/db/schema";

import { Header } from "./components/header";
import { Sidebar } from "./components/sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const userName = session.user.name ?? session.user.email ?? "Usuário";

  const userJob = await db
    .select({ jobNome: jobTable.nome })
    .from(jobUsersTable)
    .innerJoin(jobTable, eq(jobUsersTable.jobId, jobTable.id))
    .where(eq(jobUsersTable.userId, session.user.id))
    .limit(1);

  const userRole = userJob[0]?.jobNome ?? "Sem cargo";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userName={userName} userRole={userRole} />
        <main className="flex-1 overflow-y-auto">
          {children}
          <Toaster position="bottom-center" richColors theme="dark" />
        </main>
      </div>
    </div>
  );
}

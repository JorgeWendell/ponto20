import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/index";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";

import { SuportePageClient } from "./components/suporte-page-client";

export default async function SuportePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const [user] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
    })
    .from(usersTable)
    .where(eq(usersTable.id, session.user.id))
    .limit(1);

  if (!user) {
    redirect("/login");
  }

  const userName = user.name || "Usuário";
  const userEmail = user.email ?? "";

  return (
    <div className="p-6">
      <SuportePageClient
        userId={user.id}
        userName={userName}
        userEmail={userEmail}
      />
    </div>
  );
}

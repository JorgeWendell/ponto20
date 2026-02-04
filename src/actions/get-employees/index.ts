"use server";

import { desc, eq } from "drizzle-orm";

import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db/index";
import { employeesTable } from "@/db/schema";
import { jobTable } from "@/db/schema";
import { schedulesTable } from "@/db/schema";
import { locationsTable } from "@/db/schema";

import { getEmployeesSchema } from "./schema";

export const getEmployeesAction = actionClient
  .schema(getEmployeesSchema)
  .action(async () => {
    const employees = await db
      .select({
        id: employeesTable.id,
        nome: employeesTable.nome,
        jobId: employeesTable.jobId,
        jobNome: jobTable.nome,
        scheduleId: employeesTable.scheduleId,
        scheduleNome: schedulesTable.nome,
        locationId: employeesTable.locationId,
        locationNome: locationsTable.nome,
        fotoFacialUrl: employeesTable.fotoFacialUrl,
        isActive: employeesTable.isActive,
        createdAt: employeesTable.createdAt,
        updatedAt: employeesTable.updatedAt,
      })
      .from(employeesTable)
      .leftJoin(jobTable, eq(employeesTable.jobId, jobTable.id))
      .leftJoin(
        schedulesTable,
        eq(employeesTable.scheduleId, schedulesTable.id),
      )
      .leftJoin(
        locationsTable,
        eq(employeesTable.locationId, locationsTable.id),
      )
      .orderBy(desc(employeesTable.createdAt));

    return { success: true, data: employees };
  });

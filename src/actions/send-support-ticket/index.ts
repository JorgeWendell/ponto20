"use server";

import { nanoid } from "nanoid";

import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db/index";
import { supportTicketsTable } from "@/db/schema";
import { resend } from "@/lib/resend";
import { sendSupportTicketSchema } from "./schema";

const supportEmail =
  process.env.SUPPORT_EMAIL ||
  process.env.RESEND_FROM_EMAIL ||
  "suporte@adelbr.tech";

export const sendSupportTicketAction = actionClient
  .schema(sendSupportTicketSchema)
  .action(async ({ parsedInput }) => {
    const now = new Date();
    const id = nanoid();

    await db.insert(supportTicketsTable).values({
      id,
      userId: parsedInput.userId,
      titulo: parsedInput.titulo,
      descricao: parsedInput.descricao,
      createdAt: now,
      updatedAt: now,
    });

    const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Novo chamado de suporte</h2>
            <p><strong>Usuário:</strong> ${parsedInput.userName} &lt;${parsedInput.userEmail}&gt;</p>
            <p><strong>Título:</strong> ${parsedInput.titulo}</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p><strong>Descrição:</strong></p>
            <p style="white-space: pre-wrap; background: #f8fafc; padding: 12px; border-radius: 6px;">${parsedInput.descricao}</p>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from,
      to: supportEmail,
      subject: `[Suporte Ponto20] ${parsedInput.titulo}`,
      replyTo: parsedInput.userEmail,
      html,
    });

    return { success: true, id };
  });

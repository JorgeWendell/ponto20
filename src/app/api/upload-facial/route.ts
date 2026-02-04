import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const imageBase64 = body.imageBase64 as string | undefined;
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "imageBase64 é obrigatório" },
        { status: 400 },
      );
    }

    const base64Data = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;
    const buffer = Buffer.from(base64Data!, "base64");

    const dir = path.join(process.cwd(), "public", "uploads", "facial");
    await mkdir(dir, { recursive: true });

    const filename = `${nanoid()}.jpg`;
    const filePath = path.join(dir, filename);
    await writeFile(filePath, buffer);

    const url = `/uploads/facial/${filename}`;
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Erro ao fazer upload da facial:", err);
    return NextResponse.json(
      { error: "Erro ao salvar imagem" },
      { status: 500 },
    );
  }
}

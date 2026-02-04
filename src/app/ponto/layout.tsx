import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Registrar Ponto | Ponto20",
  description: "Registre seu ponto de forma rápida",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function PontoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

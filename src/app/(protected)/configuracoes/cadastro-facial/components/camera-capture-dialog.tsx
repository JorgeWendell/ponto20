"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type CameraCaptureDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (imageUrl: string) => void;
};

export function CameraCaptureDialog({
  open,
  onOpenChange,
  onCapture,
}: CameraCaptureDialogProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (!open) {
      // Limpar stream quando fechar
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsLoading(false);
      setError(null);
      return;
    }

    setError(null);
    setIsLoading(true);
    let s: MediaStream | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const constraints = [{ video: { facingMode: "user" } }, { video: true }];

    // Aguardar um pouco para garantir que o diálogo está totalmente renderizado
    const initDelay = setTimeout(() => {
      const tryGetUserMedia = async () => {
        console.log("[CameraCaptureDialog] Tentando acessar câmera...");

        // Verificar se está no cliente e se getUserMedia está disponível
        if (
          typeof window === "undefined" ||
          typeof navigator === "undefined" ||
          !navigator.mediaDevices ||
          typeof navigator.mediaDevices.getUserMedia !== "function"
        ) {
          const msg =
            "getUserMedia não está disponível. Use um navegador moderno e certifique-se de estar em HTTPS ou localhost.";
          console.error("[CameraCaptureDialog] getUserMedia não disponível");
          setError(msg);
          toast.error(msg);
          setIsLoading(false);
          return;
        }

        console.log(
          "[CameraCaptureDialog] getUserMedia disponível, tentando acessar...",
        );

        // Timeout de 10 segundos
        timeoutId = setTimeout(() => {
          if (!s && !isCancelled) {
            const msg = "Tempo de espera esgotado ao acessar a câmera.";
            setError(msg);
            toast.error(msg);
            setIsLoading(false);
          }
        }, 10000);

        for (const constraint of constraints) {
          if (isCancelled) break;

          try {
            console.log(
              "[CameraCaptureDialog] Chamando getUserMedia com constraint:",
              constraint,
            );
            const mediaStream =
              await navigator.mediaDevices.getUserMedia(constraint);

            console.log("[CameraCaptureDialog] Stream obtido com sucesso!");

            if (isCancelled) {
              console.log(
                "[CameraCaptureDialog] Operação cancelada, parando stream",
              );
              mediaStream.getTracks().forEach((t) => t.stop());
              return;
            }

            if (timeoutId) clearTimeout(timeoutId);

            s = mediaStream;
            streamRef.current = mediaStream;
            setStream(mediaStream);

            if (videoRef.current) {
              const video = videoRef.current;
              video.srcObject = mediaStream;

              const handleLoadedMetadata = () => {
                if (isCancelled) return;
                video.play().catch((playErr) => {
                  console.error("Erro ao reproduzir vídeo:", playErr);
                  if (!isCancelled) {
                    setError("Erro ao reproduzir vídeo da câmera.");
                    setIsLoading(false);
                  }
                });
              };

              const handleCanPlay = () => {
                if (isCancelled) return;
                setIsLoading(false);
              };

              video.addEventListener("loadedmetadata", handleLoadedMetadata, {
                once: true,
              });

              video.addEventListener("canplay", handleCanPlay, {
                once: true,
              });

              // Tentar play imediatamente também
              try {
                await video.play();
                if (!isCancelled) {
                  setIsLoading(false);
                }
              } catch (playErr) {
                // Se falhar, o loadedmetadata vai tentar novamente
                console.log("Aguardando metadata do vídeo...");
              }
            } else {
              setIsLoading(false);
            }
            return;
          } catch (err: any) {
            console.error("[CameraCaptureDialog] Erro ao acessar câmera:", err);

            if (isCancelled) return;

            if (
              err?.name === "NotAllowedError" ||
              err?.name === "PermissionDeniedError"
            ) {
              if (timeoutId) clearTimeout(timeoutId);
              const msg = "Permissão de câmera negada.";
              setError(msg);
              toast.error(msg);
              setIsLoading(false);
              return;
            }

            if (
              err?.name === "NotFoundError" ||
              err?.name === "DevicesNotFoundError"
            ) {
              if (timeoutId) clearTimeout(timeoutId);
              const msg = "Nenhuma câmera encontrada.";
              setError(msg);
              toast.error(msg);
              setIsLoading(false);
              return;
            }

            // Continuar tentando próximo constraint
            console.log("[CameraCaptureDialog] Tentando próximo constraint...");
            continue;
          }
        }

        if (!isCancelled) {
          if (timeoutId) clearTimeout(timeoutId);
          const msg = "Não foi possível acessar a câmera.";
          setError(msg);
          toast.error(msg);
          setIsLoading(false);
        }
      };

      tryGetUserMedia();
    }, 100); // Pequeno delay para garantir que o diálogo está renderizado

    return () => {
      isCancelled = true;
      clearTimeout(initDelay);
      if (timeoutId) clearTimeout(timeoutId);
      if (s) {
        s.getTracks().forEach((t) => t.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsLoading(false);
      setError(null);
    };
  }, [open, isMounted]);

  const handleCapture = async () => {
    if (!videoRef.current || !stream) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.9);

    setIsLoading(true);
    try {
      const baseUrl =
        typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch("/api/upload-facial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Erro ao enviar foto");
      }
      const data = await res.json();
      const url = data.url as string;
      const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
      onCapture(fullUrl);
      toast.success("Foto capturada e enviada.");
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao enviar foto.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[100] sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Coletar facial pela câmera</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : (
            <div className="relative aspect-square overflow-hidden rounded-lg border bg-slate-100 dark:bg-slate-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              {(isLoading || !stream) && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                  <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleCapture}
            disabled={!stream || isLoading || !!error}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {stream ? "Enviando..." : "Carregando câmera..."}
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Capturar e usar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

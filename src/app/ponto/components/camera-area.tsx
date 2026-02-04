"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAction } from "next-safe-action/hooks";
import { getEmployeesAction } from "@/actions/get-employees";
import { registerPontoAction } from "@/actions/register-ponto";
import { recognizeFace } from "@/actions/recognize-face";

const TIPO_OPTIONS = [
  { value: "ENTRADA", label: "Entrada" },
  { value: "SAIDA", label: "Saída" },
  { value: "ENTRADA_ALMOCO", label: "Entrada de Almoço" },
  { value: "VOLTA_ALMOCO", label: "Volta do Almoço" },
] as const;

type Employee = {
  id: string;
  nome: string;
  isActive: boolean;
};

export function CameraArea() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCheckingDevices, setIsCheckingDevices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedTipo, setSelectedTipo] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);

  const { execute: fetchEmployees } = useAction(getEmployeesAction, {
    onSuccess: ({ data }) => {
      if (data?.success && data.data) {
        setEmployees(
          data.data
            .filter((e) => e.isActive)
            .sort((a, b) => a.nome.localeCompare(b.nome))
            .map((e) => ({ id: e.id, nome: e.nome, isActive: e.isActive })),
        );
      }
    },
  });

  const { execute: registerPonto, status: registerStatus } = useAction(
    registerPontoAction,
    {
      onSuccess: ({ data }) => {
        if (data?.success) {
          const tipoLabel =
            TIPO_OPTIONS.find((t) => t.value === selectedTipo)?.label ??
            selectedTipo;
          toast.success(`Ponto registrado: ${tipoLabel}`);
          setRegisterDialogOpen(false);
          setSelectedEmployeeId("");
          setSelectedTipo("");
        }
      },
      onError: ({ error }) => {
        toast.error(error.serverError || "Erro ao registrar ponto");
      },
    },
  );

  const startCamera = async () => {
    setError(null);
    setIsCheckingDevices(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "getUserMedia não está disponível. Use um navegador moderno.",
        );
      }

      const constraints = [
        { video: true },
        { video: { facingMode: "user" } },
        { video: { facingMode: "environment" } },
      ];

      let stream: MediaStream | null = null;
      let lastError: unknown = null;

      for (const constraint of constraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          break;
        } catch (err) {
          lastError = err;
          const e = err as { name?: string };
          if (
            e.name === "NotAllowedError" ||
            e.name === "PermissionDeniedError"
          ) {
            throw err;
          }
          continue;
        }
      }

      if (!stream) {
        throw (lastError as Error) || new Error("Nenhuma câmera disponível.");
      }

      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0) {
        stream.getTracks().forEach((t) => t.stop());
        throw new Error("Stream sem vídeo.");
      }

      if (!videoRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        throw new Error("Elemento de vídeo indisponível.");
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const videoElement = videoRef.current;
      videoElement.srcObject = stream;
      streamRef.current = stream;

      videoElement.onloadedmetadata = () => {
        videoElement
          .play()
          .then(() => {
            setIsCameraActive(true);
            setError(null);
          })
          .catch((playError) => {
            setError(
              "Erro ao reproduzir vídeo: " + (playError as Error).message,
            );
            stopCamera();
          });
      };

      videoElement.onerror = () => {
        setError("Erro ao carregar vídeo.");
        stopCamera();
      };

      videoTracks[0].onended = () => setIsCameraActive(false);
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      let msg = "Não foi possível acessar a câmera.";
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        msg =
          "Permissão de câmera negada. Permita o acesso nas configurações do navegador.";
      } else if (
        e.name === "NotFoundError" ||
        e.name === "DevicesNotFoundError"
      ) {
        msg = "Nenhuma câmera encontrada.";
      } else if (
        e.name === "NotReadableError" ||
        e.name === "TrackStartError"
      ) {
        msg = "Câmera em uso por outro aplicativo.";
      } else if (e.message) {
        msg = e.message;
      }
      setError(msg);
    } finally {
      setIsCheckingDevices(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setError(null);
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !streamRef.current) return null;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const getLocation = (): Promise<{
    latitude?: string;
    longitude?: string;
  }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({});
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }),
        () => resolve({}),
        { timeout: 5000, enableHighAccuracy: false },
      );
    });
  };

  const handleFacialRecognition = async () => {
    if (!isCameraActive) {
      await startCamera();
      return;
    }
    setIsRecognizing(true);
    setError(null);
    try {
      const imageBase64 = captureFrame();
      if (!imageBase64) {
        toast.error("Não foi possível capturar a imagem.");
        return;
      }
      const location = await getLocation();
      const dispositivoInfo = `${navigator.userAgent} | ${navigator.platform}`;
      const result = await recognizeFace({
        imageBase64,
        latitude: location.latitude,
        longitude: location.longitude,
        dispositivoInfo,
      });
      if (result.success && result.data) {
        const tipoLabels: Record<string, string> = {
          ENTRADA: "Entrada",
          SAIDA: "Saída",
          ENTRADA_ALMOCO: "Entrada de Almoço",
          VOLTA_ALMOCO: "Volta do Almoço",
        };
        toast.success(
          `Ponto registrado: ${result.data.colaborador.nomeCompleto} - ${tipoLabels[result.data.tipo] ?? result.data.tipo}`,
          { duration: 5000 },
        );
      } else {
        toast.error(result.error ?? "Erro ao reconhecer.");
        setError(result.error ?? "Erro ao reconhecer.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao processar.";
      toast.error(msg);
      setError(msg);
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleOpenRegisterDialog = () => {
    if (employees.length === 0) {
      fetchEmployees({});
    }
    setSelectedEmployeeId("");
    setSelectedTipo("");
    setRegisterDialogOpen(true);
  };

  const handleRegisterPonto = () => {
    if (!selectedEmployeeId || !selectedTipo) {
      toast.error("Selecione seu nome e o tipo de marcação.");
      return;
    }
    registerPonto({
      employeeId: selectedEmployeeId,
      tipo: selectedTipo as
        | "ENTRADA"
        | "SAIDA"
        | "ENTRADA_ALMOCO"
        | "VOLTA_ALMOCO",
    });
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const isRegistering = registerStatus === "executing";

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-4 sm:gap-6">
      {error && (
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao acessar câmera</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative flex h-64 w-64 items-center justify-center overflow-hidden rounded-full border-4 border-dashed border-gray-300 bg-gray-50 sm:h-72 sm:w-72 md:h-80 md:w-80 lg:h-96 lg:w-96 dark:border-gray-600 dark:bg-gray-800">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full rounded-full object-cover ${
            isCameraActive && streamRef.current ? "block" : "hidden"
          }`}
        />
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-50 text-gray-400 dark:bg-gray-800">
            <Camera className="h-20 w-20 md:h-24 md:w-24" />
          </div>
        )}

        {(isCheckingDevices || isRecognizing) && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <Loader2 className="h-12 w-12 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="text-center">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 sm:text-xl md:text-2xl dark:text-gray-100">
          Pronto para registrar seu ponto
        </h2>
        <p className="text-sm text-gray-600 sm:text-base dark:text-gray-400">
          {isCameraActive
            ? "Posicione-se e use Reconhecimento facial ou registre manualmente"
            : "Ative a câmera para reconhecimento facial ou registre manualmente"}
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3 sm:gap-2">
        <Button
          onClick={handleFacialRecognition}
          disabled={isRegistering || isRecognizing}
          size="lg"
          className="min-h-[48px] w-full touch-manipulation bg-blue-600 text-base hover:bg-blue-700 sm:min-h-[44px] sm:text-sm dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {isRecognizing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin sm:h-4 sm:w-4" />
              Reconhecendo...
            </>
          ) : isCheckingDevices ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin sm:h-4 sm:w-4" />
              Verificando câmera...
            </>
          ) : isCameraActive ? (
            "Reconhecimento facial"
          ) : (
            "Ativar câmera"
          )}
        </Button>

        <Button
          onClick={handleOpenRegisterDialog}
          disabled={isRegistering || isRecognizing}
          variant="outline"
          size="lg"
          className="min-h-[48px] w-full touch-manipulation text-base sm:min-h-[44px] sm:text-sm"
        >
          Registrar manualmente
        </Button>

        {isCameraActive && (
          <Button
            onClick={stopCamera}
            disabled={isCheckingDevices}
            variant="ghost"
            size="sm"
            className="min-h-[44px] w-full text-slate-600 dark:text-slate-400"
          >
            Desativar câmera
          </Button>
        )}
      </div>

      <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[400px] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-base">
              Registrar ponto
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-base sm:text-sm">Seu nome</Label>
              <Select
                value={selectedEmployeeId}
                onValueChange={setSelectedEmployeeId}
              >
                <SelectTrigger className="min-h-[48px] text-base sm:min-h-[40px] sm:text-sm">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="z-[100]" position="popper">
                  {employees.map((emp) => (
                    <SelectItem
                      key={emp.id}
                      value={emp.id}
                      className="min-h-[44px] py-3 text-base sm:min-h-0 sm:py-1.5 sm:text-sm"
                    >
                      {emp.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-base sm:text-sm">Tipo de marcação</Label>
              <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                <SelectTrigger className="min-h-[48px] text-base sm:min-h-[40px] sm:text-sm">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="z-[100]" position="popper">
                  {TIPO_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="min-h-[44px] py-3 text-base sm:min-h-0 sm:py-1.5 sm:text-sm"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRegisterDialogOpen(false)}
              className="min-h-[48px] flex-1 touch-manipulation sm:min-h-[40px]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRegisterPonto}
              disabled={!selectedEmployeeId || !selectedTipo || isRegistering}
              className="min-h-[48px] flex-1 touch-manipulation sm:min-h-[40px]"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

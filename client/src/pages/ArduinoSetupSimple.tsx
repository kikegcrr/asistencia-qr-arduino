import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Download, Copy, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function ArduinoSetupSimple() {
  const [ssid, setSSID] = useState("");
  const [password, setPassword] = useState("");
  const [serverAddress, setServerAddress] = useState("192.168.1.100");
  const [serverPort, setServerPort] = useState(3001);
  const [sessionId, setSessionId] = useState(1);
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);

  const generateQuery = trpc.arduinoGenerator.generateCode.useQuery(
    { ssid, password, serverAddress, serverPort, sessionId },
    { enabled: false }
  );

  const handleGenerateClick = async () => {
    if (!ssid.trim() || !password.trim() || !serverAddress.trim() || !sessionId) {
      toast.error("Todos los campos son requeridos");
      return;
    }
    // Trigger the query manually
    await generateQuery.refetch();
  };

  const handleGenerate = async () => {
    if (!ssid.trim()) {
      toast.error("SSID requerido");
      return;
    }
    if (!password.trim()) {
      toast.error("Contraseña requerida");
      return;
    }
    if (!serverAddress.trim()) {
      toast.error("Dirección del servidor requerida");
      return;
    }
    if (!sessionId || sessionId <= 0) {
      toast.error("ID de sesión requerido");
      return;
    }

    try {
      if (generateQuery.data) {
        setGeneratedCode(generateQuery.data.code);
        toast.success("Código generado correctamente");
      }
    } catch (error) {
      toast.error("Error al generar código");
      console.error(error);
    }
  };

  const handleDownload = () => {
    if (!generatedCode) return;

    const element = document.createElement("a");
    const file = new Blob([generatedCode], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "arduino_classroom_status.ino";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Código descargado");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    toast.success("Copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="border-b-2 border-accent pb-4 mb-8">
          <h1 className="font-bold text-4xl text-foreground mb-2">Configurador Arduino</h1>
          <p className="text-sm text-muted-foreground">Genera código para tu Arduino UNO R4 WiFi</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario */}
          <div className="space-y-4">
            <Card className="border-2 border-accent rounded-sm bg-card p-6">
              <h2 className="font-bold text-foreground mb-4">Configuración</h2>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-1">
                    SSID WiFi
                  </label>
                  <Input
                    placeholder="Tu_Red_WiFi"
                    value={ssid}
                    onChange={(e) => setSSID(e.target.value)}
                    className="bg-input border-accent text-foreground"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground block mb-1">
                    Contraseña
                  </label>
                  <Input
                    type="password"
                    placeholder="Tu_Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-input border-accent text-foreground"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground block mb-1">
                    Dirección Servidor
                  </label>
                  <Input
                    placeholder="192.168.1.100"
                    value={serverAddress}
                    onChange={(e) => setServerAddress(e.target.value)}
                    className="bg-input border-accent text-foreground"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground block mb-1">
                    Puerto
                  </label>
                  <Input
                    type="number"
                    value={serverPort}
                    onChange={(e) => setServerPort(parseInt(e.target.value))}
                    className="bg-input border-accent text-foreground"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground block mb-1">
                    ID de Sesión
                  </label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={sessionId}
                    onChange={(e) => setSessionId(parseInt(e.target.value) || 1)}
                    className="bg-input border-accent text-foreground"
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generateQuery.isLoading}
                className="w-full mt-4 bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
              >
                {generateQuery.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  "Generar Código"
                )}
              </Button>
            </Card>
          </div>

          {/* Código */}
          <div>
            {generatedCode ? (
              <Card className="border-2 border-accent rounded-sm bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-foreground">Código Generado</h2>
                  <CheckCircle className="h-5 w-5 text-accent" />
                </div>

                <div className="bg-background rounded border-2 border-accent p-3 mb-4 max-h-64 overflow-y-auto font-mono text-xs text-foreground">
                  <pre>{generatedCode}</pre>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="flex-1 border-accent text-accent hover:bg-accent/10"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                  <Button
                    onClick={handleDownload}
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                  </Button>
                </div>

                <div className="mt-4 p-3 bg-card rounded border border-accent/30">
                  <p className="text-xs text-muted-foreground">
                    ✓ Código listo para Arduino IDE<br/>
                    ✓ Instala ArduinoJson desde Library Manager<br/>
                    ✓ Carga en tu Arduino UNO R4 WiFi
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="border-2 border-accent rounded-sm bg-card p-6 h-full flex items-center justify-center min-h-96">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Completa el formulario y genera el código</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

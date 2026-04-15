import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Download, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ArduinoSetup() {
  const [ssid, setSSID] = useState("");
  const [password, setPassword] = useState("");
  const [serverUrl, setServerUrl] = useState("http://192.168.1.100:3001");
  const [sessionCode, setSessionCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);

  const generateArduinoCode = () => {
    if (!ssid.trim()) {
      toast.error("Por favor ingresa el SSID de WiFi");
      return;
    }
    if (!password.trim()) {
      toast.error("Por favor ingresa la contraseña de WiFi");
      return;
    }
    if (!serverUrl.trim()) {
      toast.error("Por favor ingresa la URL del servidor");
      return;
    }
    if (!sessionCode.trim()) {
      toast.error("Por favor ingresa el código de sesión");
      return;
    }

    setIsGenerating(true);

    // Simular generación
    setTimeout(() => {
      const code = `/**
 * Arduino UNO R4 WiFi - Consulta de Número de Alumnos
 * CONFIGURACIÓN PERSONALIZADA
 * Generado automáticamente
 */

#include <WiFiC3.h>
#include <HttpClient.h>
#include <ArduinoJson.h>

// ============ CONFIGURACIÓN WIFI ============
const char* ssid = "${ssid}";
const char* password = "${password}";

// ============ CONFIGURACIÓN DEL SERVIDOR ============
const char* serverUrl = "${serverUrl}";
const char* sessionCode = "${sessionCode}";

// ============ VARIABLES GLOBALES ============
WiFiClient client;
HttpClient http(client);
unsigned long lastQueryTime = 0;
const unsigned long queryInterval = 10000; // 10 segundos

// ============ VARIABLES DE ESTADO ============
int currentStudentCount = 0;
String currentComfortStatus = "unknown";
float currentTemperature = 0.0;
float targetTemperature = 0.0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\\n\\n");
  Serial.println("================================");
  Serial.println("Arduino UNO R4 WiFi");
  Serial.println("Sistema de Consulta de Alumnos");
  Serial.println("================================");
  Serial.println();
  
  connectToWiFi();
}

void loop() {
  if (millis() - lastQueryTime >= queryInterval) {
    lastQueryTime = millis();
    queryClassroomStatus();
    displayStatus();
  }
  delay(100);
}

void connectToWiFi() {
  Serial.print("Conectando a WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("✓ WiFi conectado");
    Serial.print("  IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("✗ Error: No se pudo conectar a WiFi");
  }
}

void queryClassroomStatus() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi desconectado, reconectando...");
    connectToWiFi();
    return;
  }
  
  String url = "/api/arduino/classroom-status?sessionCode=";
  url += sessionCode;
  
  Serial.println("Consultando servidor...");
  
  int err = http.get(serverUrl, url.c_str());
  
  if (err == 0) {
    int statusCode = http.responseStatusCode();
    String response = http.responseBody();
    
    if (statusCode == 200) {
      parseResponse(response);
    } else {
      Serial.print("✗ Error HTTP: ");
      Serial.println(statusCode);
    }
  } else {
    Serial.print("✗ Error de conexión: ");
    Serial.println(err);
  }
  
  http.stop();
}

void parseResponse(String jsonString) {
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, jsonString);
  
  if (error) {
    Serial.print("✗ Error al parsear JSON: ");
    Serial.println(error.c_str());
    return;
  }
  
  if (doc["success"]) {
    currentStudentCount = doc["studentCount"] | 0;
    currentTemperature = doc["currentTemperature"] | 0.0;
    targetTemperature = doc["targetTemperature"] | 0.0;
    currentComfortStatus = doc["comfortStatus"].as<String>();
    Serial.println("✓ Datos recibidos correctamente");
  }
}

void displayStatus() {
  Serial.println();
  Serial.println("┌─────────────────────────────────┐");
  Serial.println("│     ESTADO DEL AULA             │");
  Serial.println("├─────────────────────────────────┤");
  Serial.print("│ Alumnos: ");
  Serial.print(currentStudentCount);
  Serial.println("                        │");
  Serial.print("│ Temperatura: ");
  Serial.print(currentTemperature, 1);
  Serial.println("°C                  │");
  Serial.println("└─────────────────────────────────┘");
}`;

      setGeneratedCode(code);
      setIsGenerating(false);
      toast.success("Código generado correctamente");
    }, 1000);
  };

  const downloadCode = () => {
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    toast.success("Código copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="technical-header mb-8">
          <h1 className="blueprint-title">Configurador Arduino</h1>
          <p className="blueprint-subtitle">Genera código personalizado para tu Arduino UNO R4 WiFi</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario de Configuración */}
          <div className="space-y-6">
            <Card className="technical-card">
              <h2 className="text-lg font-bold text-foreground mb-4">Configuración WiFi</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    SSID (Nombre de la Red)
                  </label>
                  <Input
                    placeholder="Tu_Red_WiFi"
                    value={ssid}
                    onChange={(e) => setSSID(e.target.value)}
                    className="bg-input border-accent text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Contraseña WiFi
                  </label>
                  <Input
                    type="password"
                    placeholder="Tu_Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-input border-accent text-foreground"
                  />
                </div>
              </div>
            </Card>

            <Card className="technical-card">
              <h2 className="text-lg font-bold text-foreground mb-4">Configuración del Servidor</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    URL del Servidor
                  </label>
                  <Input
                    placeholder="http://192.168.1.100:3001"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    className="bg-input border-accent text-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Ejemplo: http://192.168.1.100:3001 o https://tu-dominio.com
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Código de Sesión
                  </label>
                  <Input
                    placeholder="abc123def456"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value)}
                    className="bg-input border-accent text-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Obtén el código de sesión de tu app de QR
                  </p>
                </div>
              </div>
            </Card>

            <Button
              onClick={generateArduinoCode}
              disabled={isGenerating}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-6"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                "Generar Código Arduino"
              )}
            </Button>
          </div>

          {/* Código Generado */}
          <div className="space-y-6">
            {generatedCode ? (
              <>
                <Card className="technical-card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-foreground">Código Generado</h2>
                    <CheckCircle className="h-5 w-5 text-accent" />
                  </div>

                  <div className="bg-background rounded border-2 border-accent p-4 mb-4 max-h-96 overflow-y-auto font-mono text-sm text-foreground">
                    <pre>{generatedCode}</pre>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      className="flex-1 border-accent text-accent hover:bg-accent/10"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {copied ? "Copiado" : "Copiar"}
                    </Button>
                    <Button
                      onClick={downloadCode}
                      className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar
                    </Button>
                  </div>
                </Card>

                <Card className="technical-card border-2 border-accent/50">
                  <h3 className="font-bold text-foreground mb-3">Próximos Pasos</h3>
                  <ol className="space-y-2 text-sm text-foreground">
                    <li>1. Abre Arduino IDE</li>
                    <li>2. Crea un nuevo sketch</li>
                    <li>3. Copia el código generado</li>
                    <li>4. Instala las librerías requeridas (ArduinoJson)</li>
                    <li>5. Carga el código en tu Arduino UNO R4 WiFi</li>
                    <li>6. Abre el Monitor Serial (9600 baud) para ver los datos</li>
                  </ol>
                </Card>
              </>
            ) : (
              <Card className="technical-card h-full flex items-center justify-center min-h-96">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Completa la configuración y genera el código
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Información Adicional */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="technical-card">
            <h3 className="font-bold text-foreground mb-3">Librerías Requeridas</h3>
            <ul className="text-sm text-foreground space-y-2">
              <li>• ArduinoJson (v6.21.0 o superior)</li>
              <li>• WiFiC3 (incluida en Arduino UNO R4)</li>
              <li>• HttpClient (incluida en Arduino UNO R4)</li>
            </ul>
          </Card>

          <Card className="technical-card">
            <h3 className="font-bold text-foreground mb-3">Especificaciones</h3>
            <ul className="text-sm text-foreground space-y-2">
              <li>• Intervalo de consulta: 10 segundos</li>
              <li>• Baud rate: 115200</li>
              <li>• Timeout: 5 segundos</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

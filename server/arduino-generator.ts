/**
 * Generador de código Arduino personalizado
 */

export interface ArduinoConfig {
  ssid: string;
  password: string;
  serverAddress: string;
  serverPort: number;
  sessionCode: string;
}

/**
 * Genera código Arduino personalizado basado en la configuración
 */
export function generateArduinoCode(config: ArduinoConfig): string {
  return `/**
 * Arduino UNO R4 WiFi - Consulta de Alumnos
 * Código generado automáticamente
 * Fecha: ${new Date().toLocaleString()}
 */

#include <WiFiC3.h>
#include <ArduinoHttpClient.h>
#include <ArduinoJson.h>

// ========== CONFIGURACIÓN ==========
const char* ssid = "${config.ssid}";
const char* password = "${config.password}";
const char* serverAddress = "${config.serverAddress}";
const int serverPort = ${config.serverPort};
const char* sessionCode = "${config.sessionCode}";

// ========== VARIABLES ==========
WiFiClient client;
HttpClient http(client);
unsigned long lastCheck = 0;
const unsigned long checkInterval = 10000; // 10 segundos

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\\n=== Arduino Consulta de Alumnos ===");
  connectWiFi();
}

void loop() {
  if (millis() - lastCheck >= checkInterval) {
    lastCheck = millis();
    checkClassroom();
  }
  delay(100);
}

void connectWiFi() {
  Serial.print("Conectando a: ");
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
    Serial.print("OK - IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("FALLO - Verifica SSID y password");
  }
}

void checkClassroom() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi perdido, reconectando...");
    connectWiFi();
    return;
  }
  
  String path = "/api/arduino/classroom-status?sessionCode=";
  path += sessionCode;
  
  Serial.print("Consultando... ");
  
  int statusCode = http.get(serverAddress, serverPort, path.c_str());
  
  if (statusCode > 0) {
    String response = http.responseBody();
    
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error) {
      int students = doc["studentCount"] | 0;
      String status = doc["comfortStatus"] | "unknown";
      
      Serial.print("Alumnos: ");
      Serial.print(students);
      Serial.print(" | Estado: ");
      Serial.println(status);
    } else {
      Serial.println("Error JSON");
    }
  } else {
    Serial.print("Error: ");
    Serial.println(statusCode);
  }
}
`;
}

/**
 * Valida la configuración de Arduino
 */
export function validateArduinoConfig(config: ArduinoConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.ssid || config.ssid.trim().length === 0) {
    errors.push("SSID es requerido");
  }

  if (!config.password || config.password.trim().length === 0) {
    errors.push("Contraseña es requerida");
  }

  if (!config.serverAddress || config.serverAddress.trim().length === 0) {
    errors.push("Dirección del servidor es requerida");
  }

  if (config.serverPort < 1 || config.serverPort > 65535) {
    errors.push("Puerto debe estar entre 1 y 65535");
  }

  if (!config.sessionCode || config.sessionCode.trim().length === 0) {
    errors.push("Código de sesión es requerido");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

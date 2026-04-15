/**
 * Arduino UNO R4 WiFi - Consulta de Alumnos
 * Código Simple y Funcional
 * 
 * Configura estos valores:
 */

#include <WiFiC3.h>
#include <ArduinoHttpClient.h>
#include <ArduinoJson.h>

// ========== CONFIGURACIÓN ==========
const char* ssid = "TU_SSID";
const char* password = "TU_PASSWORD";
const char* serverAddress = "192.168.1.100";
const int serverPort = 3001;
const char* sessionCode = "abc123def456";

// ========== VARIABLES ==========
WiFiClient client;
HttpClient http(client);
unsigned long lastCheck = 0;
const unsigned long checkInterval = 10000; // 10 segundos

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== Arduino Consulta de Alumnos ===");
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

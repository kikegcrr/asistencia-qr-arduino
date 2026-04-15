/**
 * Arduino UNO R4 WiFi - Consulta de Número de Alumnos
 * 
 * Este código conecta Arduino a WiFi y consulta el número de alumnos
 * presentes en una sesión de aula cada 10 segundos.
 * 
 * Requisitos:
 * - Arduino UNO R4 WiFi
 * - Librería: ArduinoJson (instalar desde Arduino IDE)
 * - Librería: WiFiC3 (incluida en Arduino UNO R4)
 * 
 * Configuración:
 * 1. Reemplaza "TU_SSID" con tu nombre de red WiFi
 * 2. Reemplaza "TU_PASSWORD" con tu contraseña WiFi
 * 3. Reemplaza "http://192.168.1.100:3001" con la URL de tu servidor
 * 4. Reemplaza "abc123def456" con tu sessionCode
 */

#include <WiFiC3.h>
#include <HttpClient.h>
#include <ArduinoJson.h>

// ============ CONFIGURACIÓN WIFI ============
const char* ssid = "TU_SSID";
const char* password = "TU_PASSWORD";

// ============ CONFIGURACIÓN DEL SERVIDOR ============
const char* serverUrl = "http://192.168.1.100:3001";
const char* sessionCode = "abc123def456";

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
  // Inicializar comunicación serial
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n");
  Serial.println("================================");
  Serial.println("Arduino UNO R4 WiFi");
  Serial.println("Sistema de Consulta de Alumnos");
  Serial.println("================================");
  Serial.println();
  
  // Conectar a WiFi
  connectToWiFi();
}

void loop() {
  // Verificar si es tiempo de consultar
  if (millis() - lastQueryTime >= queryInterval) {
    lastQueryTime = millis();
    
    // Consultar estado del aula
    queryClassroomStatus();
    
    // Mostrar información
    displayStatus();
  }
  
  // Pequeña pausa para no saturar el procesador
  delay(100);
}

/**
 * Conectar a WiFi
 */
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
    Serial.println("  Verifica SSID y contraseña");
  }
}

/**
 * Consultar estado del aula desde el servidor
 */
void queryClassroomStatus() {
  // Verificar conexión WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi desconectado, reconectando...");
    connectToWiFi();
    return;
  }
  
  // Construir URL
  String url = "/api/arduino/classroom-status?sessionCode=";
  url += sessionCode;
  
  Serial.println();
  Serial.println("Consultando servidor...");
  Serial.print("  URL: ");
  Serial.println(url);
  
  // Realizar solicitud HTTP
  int err = http.get(serverUrl, url.c_str());
  
  if (err == 0) {
    Serial.println("✓ Solicitud enviada");
    
    // Leer respuesta
    int statusCode = http.responseStatusCode();
    String response = http.responseBody();
    
    Serial.print("  Status: ");
    Serial.println(statusCode);
    
    if (statusCode == 200) {
      // Parsear JSON
      parseResponse(response);
    } else {
      Serial.print("✗ Error HTTP: ");
      Serial.println(statusCode);
      Serial.print("  Respuesta: ");
      Serial.println(response);
    }
  } else {
    Serial.print("✗ Error de conexión: ");
    Serial.println(err);
  }
  
  http.stop();
}

/**
 * Parsear respuesta JSON
 */
void parseResponse(String jsonString) {
  // Crear documento JSON
  StaticJsonDocument<512> doc;
  
  // Parsear JSON
  DeserializationError error = deserializeJson(doc, jsonString);
  
  if (error) {
    Serial.print("✗ Error al parsear JSON: ");
    Serial.println(error.c_str());
    return;
  }
  
  // Extraer datos
  if (doc["success"]) {
    currentStudentCount = doc["studentCount"] | 0;
    currentTemperature = doc["currentTemperature"] | 0.0;
    targetTemperature = doc["targetTemperature"] | 0.0;
    currentComfortStatus = doc["comfortStatus"].as<String>();
    
    Serial.println("✓ Datos recibidos correctamente");
  } else {
    Serial.print("✗ Error en respuesta: ");
    Serial.println(doc["error"].as<String>());
  }
}

/**
 * Mostrar estado actual
 */
void displayStatus() {
  Serial.println();
  Serial.println("┌─────────────────────────────────┐");
  Serial.println("│     ESTADO DEL AULA             │");
  Serial.println("├─────────────────────────────────┤");
  
  Serial.print("│ Alumnos presentes: ");
  Serial.print(currentStudentCount);
  Serial.println("                  │");
  
  Serial.print("│ Temperatura actual: ");
  Serial.print(currentTemperature, 1);
  Serial.println("°C              │");
  
  Serial.print("│ Temperatura objetivo: ");
  Serial.print(targetTemperature, 1);
  Serial.println("°C            │");
  
  Serial.print("│ Estado: ");
  Serial.print(currentComfortStatus);
  Serial.println("                    │");
  
  Serial.println("└─────────────────────────────────┘");
}

/**
 * Función auxiliar para obtener dirección IP como string
 */
String getIPAddress() {
  IPAddress ip = WiFi.localIP();
  String ipString = String(ip[0]) + "." + String(ip[1]) + "." + String(ip[2]) + "." + String(ip[3]);
  return ipString;
}

/**
 * Función para verificar estado de WiFi
 */
void checkWiFiStatus() {
  wl_status_t status = WiFi.status();
  
  switch (status) {
    case WL_CONNECTED:
      Serial.println("WiFi: Conectado");
      break;
    case WL_NO_SHIELD:
      Serial.println("WiFi: Módulo no disponible");
      break;
    case WL_IDLE_STATUS:
      Serial.println("WiFi: Esperando conexión");
      break;
    case WL_NO_SSID_AVAIL:
      Serial.println("WiFi: Red no disponible");
      break;
    case WL_SCAN_COMPLETED:
      Serial.println("WiFi: Escaneo completado");
      break;
    case WL_CONNECT_FAILED:
      Serial.println("WiFi: Conexión fallida");
      break;
    case WL_CONNECTION_LOST:
      Serial.println("WiFi: Conexión perdida");
      break;
    case WL_DISCONNECTED:
      Serial.println("WiFi: Desconectado");
      break;
    default:
      Serial.println("WiFi: Estado desconocido");
      break;
  }
}

/*
  Sistema de Gestión Climática Inteligente para Aulas
  Arduino UNO R4 WiFi + Sensor DHT22
  
  Este código consulta el número de alumnos cada 10 segundos
  desde el servidor de gestión climática y muestra la información
  en el Serial Monitor.
  
  Hardware requerido:
  - Arduino UNO R4 WiFi (ABX00087)
  - Sensor DHT22 (temperatura y humedad)
  - Conexión WiFi
  
  Conexiones:
  - DHT22 Data pin → Arduino pin 2
  - DHT22 VCC → Arduino 5V
  - DHT22 GND → Arduino GND
*/

#include <WiFiS3.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ============ CONFIGURACIÓN ============
// Estos valores se reemplazarán por el configurador web
const char* WIFI_SSID = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";
const char* SERVER_URL = "http://your-server.com";
const char* SESSION_CODE = "your-session-code";

// Sensor DHT22
#define DHT_PIN 2
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

// Variables globales
unsigned long lastQueryTime = 0;
const unsigned long QUERY_INTERVAL = 10000; // 10 segundos
int studentCount = 0;
float currentTemperature = 0.0;
float currentHumidity = 0.0;
float targetTemperature = 0.0;
String comfortStatus = "unknown";
bool wifiConnected = false;

// ============ SETUP ============
void setup() {
  Serial.begin(9600);
  delay(2000);
  
  Serial.println("\n\n=== Sistema de Gestión Climática ===");
  Serial.println("Arduino UNO R4 WiFi + DHT22");
  Serial.println("=====================================\n");
  
  // Inicializar sensor DHT22
  dht.begin();
  Serial.println("[DHT22] Sensor inicializado");
  
  // Conectar a WiFi
  connectToWiFi();
  
  // Primera lectura del sensor
  readDHT22Sensor();
}

// ============ LOOP PRINCIPAL ============
void loop() {
  // Verificar conexión WiFi
  if (WiFi.status() != WL_CONNECTED) {
    if (wifiConnected) {
      Serial.println("\n[WiFi] Conexión perdida. Intentando reconectar...");
      wifiConnected = false;
    }
    connectToWiFi();
  }
  
  // Leer sensor DHT22
  readDHT22Sensor();
  
  // Consultar servidor cada 10 segundos
  if (millis() - lastQueryTime >= QUERY_INTERVAL) {
    lastQueryTime = millis();
    queryClassroomStatus();
  }
  
  delay(1000);
}

// ============ FUNCIONES ============

/**
 * Conectar a la red WiFi
 */
void connectToWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }
  
  Serial.println("\n[WiFi] Conectando...");
  Serial.print("[WiFi] SSID: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\n[WiFi] ✓ Conectado");
    Serial.print("[WiFi] IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi] ✗ Error de conexión");
    wifiConnected = false;
  }
}

/**
 * Leer temperatura y humedad del sensor DHT22
 */
void readDHT22Sensor() {
  // Leer valores del sensor
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  
  // Verificar si la lectura fue exitosa
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("[DHT22] Error al leer el sensor");
    return;
  }
  
  // Actualizar variables globales
  currentTemperature = temperature;
  currentHumidity = humidity;
  
  Serial.print("[DHT22] Temperatura: ");
  Serial.print(currentTemperature);
  Serial.print("°C | Humedad: ");
  Serial.print(currentHumidity);
  Serial.println("%");
}

/**
 * Consultar el estado del aula desde el servidor
 */
void queryClassroomStatus() {
  if (!wifiConnected) {
    Serial.println("[API] No hay conexión WiFi");
    return;
  }
  
  Serial.println("\n[API] Consultando estado del aula...");
  
  // Construir URL de consulta
  String url = String(SERVER_URL) + "/api/trpc/arduino.classroomStatus";
  
  // Crear cliente HTTP
  WiFiClient client;
  
  // Conectar al servidor
  if (!client.connect(SERVER_URL, 80)) {
    Serial.println("[API] ✗ Error de conexión al servidor");
    return;
  }
  
  // Enviar solicitud GET
  client.print("GET ");
  client.print(url);
  client.println(" HTTP/1.1");
  client.print("Host: ");
  client.println(SERVER_URL);
  client.println("Connection: close");
  client.println();
  
  // Esperar respuesta
  unsigned long timeout = millis() + 5000; // Timeout de 5 segundos
  String response = "";
  boolean headerEnd = false;
  
  while (client.connected() && millis() < timeout) {
    if (client.available()) {
      char c = client.read();
      
      if (!headerEnd) {
        if (c == '\n' && response.endsWith("\r\n\r\n")) {
          headerEnd = true;
          response = ""; // Limpiar para recibir solo el body
        } else {
          response += c;
        }
      } else {
        response += c;
      }
    }
  }
  
  client.stop();
  
  // Procesar respuesta JSON
  if (response.length() > 0) {
    parseClassroomStatus(response);
  } else {
    Serial.println("[API] ✗ Respuesta vacía");
  }
}

/**
 * Parsear respuesta JSON del servidor
 */
void parseClassroomStatus(String jsonResponse) {
  // Crear documento JSON
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, jsonResponse);
  
  if (error) {
    Serial.print("[JSON] Error: ");
    Serial.println(error.f_str());
    return;
  }
  
  // Extraer datos
  if (doc["result"]["data"]["success"]) {
    studentCount = doc["result"]["data"]["studentCount"] | 0;
    targetTemperature = doc["result"]["data"]["targetTemperature"] | 0.0;
    comfortStatus = doc["result"]["data"]["comfortStatus"].as<String>();
    
    Serial.println("[API] ✓ Datos recibidos:");
    Serial.print("  - Alumnos: ");
    Serial.println(studentCount);
    Serial.print("  - Temp. objetivo: ");
    Serial.print(targetTemperature);
    Serial.println("°C");
    Serial.print("  - Estado: ");
    Serial.println(comfortStatus);
  } else {
    Serial.println("[API] ✗ Error en respuesta del servidor");
  }
}

/*
  NOTAS DE INSTALACIÓN:
  
  1. Instalar librerías en Arduino IDE:
     - Sketch > Include Library > Manage Libraries
     - Buscar e instalar: "DHT sensor library" (Adafruit)
     - Buscar e instalar: "ArduinoJson" (Benoit Blanchon)
  
  2. Configurar placa:
     - Tools > Board > Arduino UNO R4 WiFi
     - Tools > Port > Seleccionar puerto COM
  
  3. Reemplazar valores de configuración:
     - WIFI_SSID: Tu red WiFi
     - WIFI_PASSWORD: Contraseña WiFi
     - SERVER_URL: URL de tu servidor (sin http://)
     - SESSION_CODE: Código de sesión
  
  4. Cargar el código en Arduino
  
  5. Abrir Serial Monitor (9600 baud) para ver logs
*/

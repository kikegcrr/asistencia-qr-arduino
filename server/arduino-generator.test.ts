import { describe, expect, it } from "vitest";
import { generateArduinoCode, validateArduinoConfig } from "./arduino-generator";

describe("Arduino Code Generator", () => {
  describe("generateArduinoCode", () => {
    it("should generate valid Arduino code with configuration", () => {
      const config = {
        ssid: "TestNetwork",
        password: "TestPassword123",
        serverAddress: "192.168.1.100",
        serverPort: 3001,
        sessionCode: "test-session-123",
      };

      const code = generateArduinoCode(config);

      expect(code).toContain('const char* WIFI_SSID = "TestNetwork"');
      expect(code).toContain('const char* WIFI_PASSWORD = "TestPassword123"');
      expect(code).toContain("http://192.168.1.100:3001");
      expect(code).toContain('const char* SESSION_CODE = "test-session-123"');
    });

    it("should include required libraries for DHT22", () => {
      const config = {
        ssid: "Test",
        password: "Test",
        serverAddress: "192.168.1.1",
        serverPort: 3001,
        sessionCode: "test",
      };

      const code = generateArduinoCode(config);

      expect(code).toContain("#include <WiFiS3.h>");
      expect(code).toContain("#include <DHT.h>");
      expect(code).toContain("#include <ArduinoJson.h>");
    });

    it("should include setup and loop functions", () => {
      const config = {
        ssid: "Test",
        password: "Test",
        serverAddress: "192.168.1.1",
        serverPort: 3001,
        sessionCode: "test",
      };

      const code = generateArduinoCode(config);

      expect(code).toContain("void setup()");
      expect(code).toContain("void loop()");
      expect(code).toContain("void connectToWiFi()");
      expect(code).toContain("void readDHT22Sensor()");
      expect(code).toContain("void queryClassroomStatus()");
    });

    it("should include 10 second interval", () => {
      const config = {
        ssid: "Test",
        password: "Test",
        serverAddress: "192.168.1.1",
        serverPort: 3001,
        sessionCode: "test",
      };

      const code = generateArduinoCode(config);

      expect(code).toContain("10000");
      expect(code).toContain("QUERY_INTERVAL");
    });

    it("should include DHT22 pin configuration", () => {
      const config = {
        ssid: "Test",
        password: "Test",
        serverAddress: "192.168.1.1",
        serverPort: 3001,
        sessionCode: "test",
      };

      const code = generateArduinoCode(config);

      expect(code).toContain("#define DHT_PIN 2");
      expect(code).toContain("#define DHT_TYPE DHT22");
    });
  });

  describe("validateArduinoConfig", () => {
    it("should validate correct configuration", () => {
      const config = {
        ssid: "TestNetwork",
        password: "TestPassword123",
        serverAddress: "192.168.1.100",
        serverPort: 3001,
        sessionCode: "test-session-123",
      };

      const result = validateArduinoConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty SSID", () => {
      const config = {
        ssid: "",
        password: "TestPassword123",
        serverAddress: "192.168.1.100",
        serverPort: 3001,
        sessionCode: "test-session-123",
      };

      const result = validateArduinoConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("SSID es requerido");
    });

    it("should reject empty password", () => {
      const config = {
        ssid: "TestNetwork",
        password: "",
        serverAddress: "192.168.1.100",
        serverPort: 3001,
        sessionCode: "test-session-123",
      };

      const result = validateArduinoConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Contraseña es requerida");
    });

    it("should reject empty server address", () => {
      const config = {
        ssid: "TestNetwork",
        password: "TestPassword123",
        serverAddress: "",
        serverPort: 3001,
        sessionCode: "test-session-123",
      };

      const result = validateArduinoConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Dirección del servidor es requerida");
    });

    it("should reject invalid port (too low)", () => {
      const config = {
        ssid: "TestNetwork",
        password: "TestPassword123",
        serverAddress: "192.168.1.100",
        serverPort: 0,
        sessionCode: "test-session-123",
      };

      const result = validateArduinoConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Puerto debe estar entre 1 y 65535");
    });

    it("should reject invalid port (too high)", () => {
      const config = {
        ssid: "TestNetwork",
        password: "TestPassword123",
        serverAddress: "192.168.1.100",
        serverPort: 65536,
        sessionCode: "test-session-123",
      };

      const result = validateArduinoConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Puerto debe estar entre 1 y 65535");
    });

    it("should reject empty session code", () => {
      const config = {
        ssid: "TestNetwork",
        password: "TestPassword123",
        serverAddress: "192.168.1.100",
        serverPort: 3001,
        sessionCode: "",
      };

      const result = validateArduinoConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Código de sesión es requerido");
    });

    it("should report multiple errors", () => {
      const config = {
        ssid: "",
        password: "",
        serverAddress: "",
        serverPort: 0,
        sessionCode: "",
      };

      const result = validateArduinoConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});

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

      expect(code).toContain("const char* ssid = \"TestNetwork\"");
      expect(code).toContain("const char* password = \"TestPassword123\"");
      expect(code).toContain("const char* serverAddress = \"192.168.1.100\"");
      expect(code).toContain("const int serverPort = 3001");
      expect(code).toContain("const char* sessionCode = \"test-session-123\"");
    });

    it("should include required libraries", () => {
      const config = {
        ssid: "Test",
        password: "Test",
        serverAddress: "192.168.1.1",
        serverPort: 3001,
        sessionCode: "test",
      };

      const code = generateArduinoCode(config);

      expect(code).toContain("#include <WiFiC3.h>");
      expect(code).toContain("#include <ArduinoHttpClient.h>");
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
      expect(code).toContain("void connectWiFi()");
      expect(code).toContain("void checkClassroom()");
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
      expect(code).toContain("checkInterval");
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

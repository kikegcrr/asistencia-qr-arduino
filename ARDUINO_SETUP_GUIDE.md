# Guía: Configurador de Arduino

## ¿Qué es?

El **Configurador de Arduino** es una interfaz web que te permite generar código Arduino personalizado sin necesidad de escribir código. Solo necesitas:

1. Tu SSID (nombre de la red WiFi)
2. Tu contraseña WiFi
3. La URL del servidor (donde está el sistema de gestión climática)
4. El código de sesión de tu app de QR

## Acceso

1. Abre el sistema de gestión climática en tu navegador
2. Haz clic en "Integración Arduino" o ve a `/arduino-setup`
3. Completa el formulario
4. Haz clic en "Generar Código Arduino"
5. Descarga o copia el código

## Paso a Paso

### 1. Configuración WiFi

**SSID (Nombre de la Red)**
- Ejemplo: `Mi_Red_WiFi`
- Es el nombre que ves cuando buscas redes disponibles

**Contraseña WiFi**
- La contraseña de tu red WiFi
- Se incluye en el código generado (considera la seguridad)

### 2. Configuración del Servidor

**URL del Servidor**
- Ejemplo local: `http://192.168.1.100:3001`
- Ejemplo remoto: `https://tu-dominio.com`
- Debe ser accesible desde tu Arduino

**Código de Sesión**
- Obtén esto de tu app de QR
- Es el código único de la sesión activa
- Ejemplo: `abc123def456`

### 3. Generar Código

Haz clic en "Generar Código Arduino" y espera a que se genere.

### 4. Descargar o Copiar

- **Descargar**: Descarga el archivo `.ino` directamente
- **Copiar**: Copia el código al portapapeles

## Instalación en Arduino

### Requisitos

- Arduino IDE (descarga desde https://www.arduino.cc/en/software)
- Arduino UNO R4 WiFi
- Librerías instaladas:
  - ArduinoJson (v6.21.0 o superior)
  - WiFiC3 (incluida)
  - HttpClient (incluida)

### Pasos

1. **Abre Arduino IDE**

2. **Instala ArduinoJson**
   - Ve a: Sketch → Include Library → Manage Libraries
   - Busca: `ArduinoJson`
   - Haz clic en "Install"

3. **Crea un nuevo sketch**
   - File → New

4. **Copia el código generado**
   - Pega el código en el editor

5. **Selecciona tu placa**
   - Tools → Board → Arduino UNO R4 WiFi

6. **Selecciona el puerto**
   - Tools → Port → COM... (Windows) o /dev/ttyUSB... (Linux/Mac)

7. **Carga el código**
   - Haz clic en el botón "Upload" (flecha derecha)
   - Espera a que se complete

### Verificación

1. **Abre el Monitor Serial**
   - Tools → Serial Monitor
   - Baud rate: 115200

2. **Verifica la conexión**
   - Deberías ver mensajes de conexión WiFi
   - Luego mensajes de consulta al servidor
   - Finalmente, el número de alumnos

## Ejemplo de Salida

```
================================
Arduino UNO R4 WiFi
Sistema de Consulta de Alumnos
================================

Conectando a WiFi: Mi_Red_WiFi
.....
✓ WiFi conectado
  IP: 192.168.1.50

Consultando servidor...
  URL: /api/arduino/classroom-status?sessionCode=abc123def456
✓ Solicitud enviada
  Status: 200
✓ Datos recibidos correctamente

┌─────────────────────────────────┐
│     ESTADO DEL AULA             │
├─────────────────────────────────┤
│ Alumnos presentes: 25           │
│ Temperatura actual: 22.5°C      │
│ Temperatura objetivo: 21.8°C    │
│ Estado: comfortable             │
└─────────────────────────────────┘
```

## Troubleshooting

### "WiFi desconectado"

**Problema**: Arduino no se conecta a WiFi

**Soluciones**:
1. Verifica SSID y contraseña
2. Asegúrate de que el Arduino está cerca del router
3. Reinicia el Arduino
4. Verifica que el router está encendido

### "Error HTTP: 404"

**Problema**: El servidor no responde

**Soluciones**:
1. Verifica que la URL es correcta
2. Verifica que el servidor está corriendo
3. Verifica que Arduino y servidor están en la misma red
4. Prueba con `ping` desde tu computadora

### "Error al parsear JSON"

**Problema**: La respuesta del servidor no es válida

**Soluciones**:
1. Verifica que el `sessionCode` es correcto
2. Verifica que hay una sesión activa
3. Revisa los logs del servidor

### "No se puede cargar el código"

**Problema**: Arduino IDE no puede subir el código

**Soluciones**:
1. Verifica que seleccionaste el puerto correcto
2. Verifica que seleccionaste la placa correcta
3. Desconecta y reconecta el Arduino
4. Reinicia Arduino IDE

## Configuración Avanzada

### Cambiar Intervalo de Consulta

En el código generado, busca:
```cpp
const unsigned long queryInterval = 10000; // 10 segundos
```

Cambia `10000` por el intervalo deseado en milisegundos:
- 5000 = 5 segundos
- 30000 = 30 segundos
- 60000 = 1 minuto

### Cambiar Baud Rate

En el código generado, busca:
```cpp
Serial.begin(115200);
```

Cambia `115200` por el baud rate deseado:
- 9600 (más lento, más compatible)
- 115200 (más rápido, recomendado)

## Seguridad

⚠️ **Importante**: El código generado incluye tu contraseña WiFi. Considera:

1. **No compartas el código** con personas no autorizadas
2. **Usa WiFi seguro** (WPA2 o superior)
3. **Cambia la contraseña WiFi** regularmente
4. **Usa HTTPS** para el servidor en producción

## Soporte

Si tienes problemas:

1. Revisa los logs del Serial Monitor
2. Verifica la conectividad de red
3. Consulta la documentación de Arduino
4. Abre un issue en el repositorio

---

**Última actualización**: 15 de Abril de 2026
**Versión**: 1.0.0

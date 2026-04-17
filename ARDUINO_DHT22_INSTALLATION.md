# Guía de Instalación: Arduino UNO R4 WiFi + Sensor DHT22

## Descripción General

Este documento proporciona una guía paso a paso para instalar y configurar tu Arduino UNO R4 WiFi con un sensor DHT22 para que funcione con el sistema de gestión climática inteligente.

## Hardware Requerido

| Componente | Modelo | Cantidad |
|-----------|--------|----------|
| Placa Arduino | UNO R4 WiFi (ABX00087) | 1 |
| Sensor de Temperatura/Humedad | SATKIT DHT22 | 1 |
| Cable USB | USB-C (para Arduino UNO R4) | 1 |
| Cables de conexión | Jumpers macho-hembra | 3+ |
| Resistencia | 10kΩ (opcional, para estabilidad) | 1 |

## Conexiones Físicas

### Esquema de Conexión

```
DHT22 (3 pines)
├── VCC (pin 1) → Arduino 5V
├── DATA (pin 2) → Arduino Digital Pin 2
└── GND (pin 4) → Arduino GND

Nota: El pin 3 del DHT22 no se utiliza
```

### Diagrama Visual

```
Arduino UNO R4 WiFi
┌─────────────────────────────────────┐
│  5V ────────────────┐               │
│                     │               │
│  GND ────────────────┼───────────┐   │
│                     │           │   │
│  Pin 2 ─────────────┼───────────┤   │
│                     │           │   │
│                  ┌──▼──┬────┬───▼──┐│
│                  │ VCC │DATA│ GND  ││
│                  └─────┴────┴──────┘│
│                    DHT22 Sensor    │
└─────────────────────────────────────┘
```

## Instalación de Librerías

### Paso 1: Abrir Arduino IDE

1. Descarga e instala [Arduino IDE](https://www.arduino.cc/en/software)
2. Abre Arduino IDE

### Paso 2: Instalar Librerías Requeridas

1. Ve a **Sketch** → **Include Library** → **Manage Libraries**
2. Busca e instala las siguientes librerías:

#### Librería DHT
- **Nombre**: DHT sensor library
- **Autor**: Adafruit
- **Versión**: 1.4.4 o superior

#### Librería JSON
- **Nombre**: ArduinoJson
- **Autor**: Benoit Blanchon
- **Versión**: 6.21.0 o superior

### Paso 3: Configurar la Placa

1. Ve a **Tools** → **Board** → Busca **Arduino UNO R4 WiFi**
2. Selecciona **Arduino UNO R4 WiFi**
3. Ve a **Tools** → **Port** → Selecciona el puerto COM donde está conectado Arduino
4. Verifica que **Tools** → **Programmer** esté configurado correctamente

## Generación y Carga del Código

### Paso 1: Generar Código Personalizado

1. Accede a la interfaz web del sistema: `http://tu-servidor/arduino-setup`
2. Completa los siguientes campos:
   - **SSID**: Nombre de tu red WiFi
   - **Contraseña**: Contraseña de tu red WiFi
   - **Servidor**: IP o dominio de tu servidor (ej: 192.168.1.100)
   - **Puerto**: Puerto del servidor (ej: 3000)
   - **Código de Sesión**: Código de la sesión del aula

3. Haz clic en **Generar Código Arduino**
4. Descarga el archivo `.ino` generado

### Paso 2: Cargar el Código en Arduino

1. Abre Arduino IDE
2. Ve a **File** → **Open** → Selecciona el archivo `.ino` descargado
3. Conecta Arduino a tu computadora con el cable USB-C
4. Haz clic en **Upload** (botón de flecha derecha)
5. Espera a que se complete la carga

### Paso 3: Verificar la Instalación

1. Abre **Tools** → **Serial Monitor**
2. Establece la velocidad en **9600 baud**
3. Deberías ver logs como:

```
=== Sistema de Gestión Climática ===
Arduino UNO R4 WiFi + DHT22
=====================================

[DHT22] Sensor inicializado
[WiFi] Conectando...
[WiFi] SSID: Mi_Red_WiFi
[WiFi] ✓ Conectado
[WiFi] IP: 192.168.1.100
[DHT22] Temperatura: 22.5°C | Humedad: 45%
[API] Consultando estado del aula...
[API] ✓ Datos recibidos:
  - Alumnos: 25
  - Temp. objetivo: 22.0°C
  - Estado: comfortable
```

## Solución de Problemas

### Problema: "Error al leer el sensor DHT22"

**Causa**: El sensor no está conectado correctamente o hay un problema de comunicación.

**Soluciones**:
1. Verifica que el pin DATA del DHT22 esté conectado al pin 2 de Arduino
2. Comprueba que los cables están bien insertados
3. Intenta agregar una resistencia pull-up de 10kΩ entre VCC y DATA
4. Reinicia Arduino

### Problema: "WiFi perdido, reconectando..."

**Causa**: La conexión WiFi se perdió o no se puede conectar.

**Soluciones**:
1. Verifica que el SSID y contraseña sean correctos
2. Comprueba que tu red WiFi está disponible
3. Acerca Arduino a tu router WiFi
4. Reinicia Arduino

### Problema: "[API] ✗ Error de conexión al servidor"

**Causa**: Arduino no puede conectar con el servidor.

**Soluciones**:
1. Verifica que la dirección del servidor sea correcta
2. Comprueba que el puerto sea accesible
3. Asegúrate de que Arduino y el servidor están en la misma red
4. Verifica el firewall del servidor

### Problema: "[JSON] Error: ..."

**Causa**: La respuesta del servidor no es un JSON válido.

**Soluciones**:
1. Verifica que el servidor está corriendo
2. Comprueba que el endpoint `/api/trpc/arduino.classroomStatus` es accesible
3. Revisa los logs del servidor para más detalles

## Características del Código

### Lectura de Sensor DHT22

El código lee automáticamente:
- **Temperatura**: En grados Celsius
- **Humedad**: En porcentaje (%)

Las lecturas se muestran en el Serial Monitor cada segundo.

### Consulta de Estado del Aula

Cada 10 segundos, Arduino consulta el servidor para obtener:
- **Número de alumnos**: Conteo actual de alumnos en la sesión
- **Temperatura objetivo**: Temperatura recomendada según RITE/ASHRAE
- **Estado de confort**: "comfortable", "too_hot", "too_cold", o "unknown"

### Manejo de Reconexión

Si Arduino pierde la conexión WiFi:
1. Lo detecta automáticamente
2. Intenta reconectar
3. Reanuda las consultas cuando se reconecta

## Personalización

### Cambiar el Pin del Sensor DHT22

Si necesitas usar un pin diferente al pin 2:

1. Abre el código Arduino
2. Busca la línea: `#define DHT_PIN 2`
3. Cambia `2` al número de pin deseado
4. Carga el código nuevamente

### Cambiar el Intervalo de Consulta

Para cambiar cada cuánto tiempo consulta el servidor (por defecto 10 segundos):

1. Busca la línea: `const unsigned long QUERY_INTERVAL = 10000;`
2. Cambia `10000` al valor deseado en milisegundos
3. Ejemplo: `5000` = 5 segundos, `30000` = 30 segundos

### Cambiar la Velocidad del Serial Monitor

Para cambiar la velocidad de comunicación serial (por defecto 9600):

1. Busca la línea: `Serial.begin(9600);`
2. Cambia `9600` a la velocidad deseada
3. Asegúrate de que el Serial Monitor también esté configurado con la misma velocidad

## Especificaciones Técnicas

### Arduino UNO R4 WiFi

| Especificación | Valor |
|----------------|-------|
| Microcontrolador | RA4M1 |
| Voltaje de Operación | 5V |
| Pines Digitales | 14 (6 PWM) |
| Pines Analógicos | 6 |
| Memoria Flash | 256 KB |
| SRAM | 32 KB |
| Velocidad de Reloj | 48 MHz |
| Conectividad WiFi | 802.11 b/g/n |

### Sensor DHT22

| Especificación | Valor |
|----------------|-------|
| Rango de Temperatura | -40°C a 80°C |
| Precisión de Temperatura | ±0.5°C |
| Rango de Humedad | 0% a 100% |
| Precisión de Humedad | ±2% |
| Tiempo de Respuesta | < 2 segundos |
| Voltaje de Operación | 3.3V a 5V |
| Consumo de Corriente | 1-1.5 mA |

## Referencias

- [Arduino UNO R4 WiFi Documentación](https://docs.arduino.cc/hardware/uno-r4-wifi)
- [DHT Sensor Library - Adafruit](https://github.com/adafruit/DHT-sensor-library)
- [ArduinoJson - Benoit Blanchon](https://arduinojson.org/)
- [RITE - Reglamento de Instalaciones Térmicas](https://www.boe.es/)
- [ASHRAE - American Society of Heating, Refrigerating and Air-Conditioning Engineers](https://www.ashrae.org/)

## Soporte

Si encuentras problemas durante la instalación:

1. Revisa la sección "Solución de Problemas" anterior
2. Consulta los logs del Serial Monitor para mensajes de error
3. Verifica que todas las conexiones estén correctas
4. Contacta al equipo de soporte técnico

---

**Última actualización**: Abril 2026
**Versión**: 1.0
**Autor**: Sistema de Gestión Climática Inteligente

# Sistema de Gestión Climática Inteligente para Aulas - TODO

## Fase 1: Estructura de Datos y Endpoints
- [x] Diseñar esquema de base de datos (sesiones, alumnos, registros de temperatura)
- [x] Crear tablas en Drizzle: ClassroomSession, StudentAttendance, TemperatureLog
- [x] Implementar endpoint GET /api/arduino/classroom-status (público, sin auth)
- [x] Implementar endpoint POST /api/arduino/update-students (público, sin auth)
- [x] Crear procedimientos tRPC para gestión interna de sesiones

## Fase 2: Endpoints REST Públicos
- [x] Validar y documentar estructura JSON de respuestas
- [x] Implementar lógica de consulta de sesión activa
- [x] Implementar lógica de actualización de estudiantes
- [x] Agregar manejo de errores y validaciones
- [x] Crear endpoints REST públicos (/api/arduino/*)
- [x] Integración segura con app de QR (no-invasiva)
- [x] Documentación de integración completa
- [x] Pruebas unitarias para endpoints (15 tests pasando)

## Fase 3: Panel de Control en Tiempo Real
- [x] Crear página de dashboard principal
- [x] Implementar gestión de sesiones (crear, activar, cerrar)
- [x] Mostrar número actual de alumnos conectados
- [x] Implementar lista de alumnos presentes con hora de entrada
- [ ] Agregar estado de conexión con Arduino

## Fase 4: Lógica de Cálculo de Temperatura
- [x] Implementar algoritmo RITE/ASHRAE para cálculo de temperatura objetivo
- [x] Integrar datos de época del año y hora del día
- [x] Crear función de cálculo de estado de confort
- [x] Agregar visualización de temperatura objetivo vs actual
- [x] Crear pruebas unitarias (23 tests pasando)

## Fase 5: Diseño Visual (Estética CAD)
- [x] Diseñar tema azul royal oscuro con cuadrícula técnica (parcial)
- [x] Implementar componentes con líneas blancas y marcos rectangulares (parcial)
- [ ] Crear marcadores de dimensión y elementos CAD
- [x] Aplicar tipografía sans-serif blanca y negrita
- [x] Diseñar layout de dashboard con jerarquía visual clara

## Fase 6: Descarga de Código Arduino y Documentación
- [x] Generar archivo .ino optimizado para descarga
- [x] Crear documentación de integración en HTML/PDF
- [x] Interfaz web para configurar Arduino
- [x] Generador de código personalizado
- [ ] Implementar botones de descarga en la interfaz
- [ ] Incluir guía de configuración WiFi y endpoints

## Fase 7: Historial y Estadísticas
- [ ] Crear página de historial de sesiones
- [ ] Implementar gráficos de asistencia
- [ ] Implementar gráficos de temperatura
- [ ] Exportar datos a CSV/PDF

## Fase 8: Código Arduino Funcional (DHT22)
- [x] Crear código Arduino optimizado para UNO R4 WiFi + DHT22
- [x] Consulta cada 10 segundos
- [x] Lectura de temperatura y humedad desde DHT22
- [x] Lectura de JSON desde servidor
- [x] Mostrar número de alumnos en Serial Monitor
- [x] Manejo de errores y reconexión WiFi
- [x] Endpoint backend para generar código personalizado
- [x] Interfaz web simplificada para configurar Arduino
- [x] Descarga de código .ino personalizado
- [x] Documentación de instalación completa (ARDUINO_DHT22_INSTALLATION.md)
- [x] 13 pruebas unitarias para generador (51 tests totales)

## Fase 9: Pruebas e Integración
- [x] Pruebas de endpoints públicos (15 tests)
- [x] Pruebas de generador Arduino (13 tests)
- [x] Pruebas de cálculo de temperatura (22 tests)
- [x] Pruebas de autenticación (1 test)
- [x] Total: 51 tests pasando

## Fase 10: Resolución de Problemas
- [x] Agregar botón de volver al Dashboard
- [x] Corregir navegación entre páginas
- [x] Hacer Dashboard accesible sin autenticación
- [x] Agregar onClick a tarjetas de características

## Estado Final
- [x] Sistema de gestión climática completamente funcional
- [x] Integración con app de QR (no-invasiva)
- [x] Endpoints REST públicos para Arduino
- [x] Configurador web para Arduino
- [x] Código Arduino optimizado para UNO R4 WiFi + DHT22
- [x] Documentación completa de instalación
- [x] 51 pruebas unitarias pasando
- [x] Navegación y UI funcionales
- [x] Dashboard accesible y usable
- [x] Generador de código personalizado
- [x] Integración con app de QR verificada

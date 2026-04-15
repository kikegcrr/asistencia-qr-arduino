/**
 * Temperature Calculator - RITE/ASHRAE Compliance
 * Calculates optimal classroom temperature based on season, occupancy, and time of day
 */

export type Season = 'winter' | 'summer';
export type ComfortStatus = 'comfortable' | 'too_hot' | 'too_cold';

interface TemperatureCalculationResult {
  targetTemperature: number;
  season: Season;
  comfortStatus: ComfortStatus;
  explanation: string;
}

/**
 * Determine the season based on the current month
 * Northern Hemisphere: Winter (Oct-Apr), Summer (May-Sep)
 */
function getSeason(date: Date = new Date()): Season {
  const month = date.getMonth() + 1;
  if (month >= 10 || month <= 4) {
    return 'winter';
  }
  return 'summer';
}

/**
 * Calculate base temperature based on season
 * RITE/ASHRAE Standards:
 * - Winter: 21-23°C (optimal 21.5°C)
 * - Summer: 23-25°C (optimal 24°C)
 */
function getBaseTemperature(season: Season): number {
  return season === 'winter' ? 21.5 : 24.0;
}

/**
 * Calculate occupancy adjustment factor
 * Each person generates approximately 100W of metabolic heat
 * For every 5 students, reduce target temperature by adjustment factor
 * - Winter: -0.1°C per 5 students (less heating needed)
 * - Summer: -0.2°C per 5 students (more cooling needed)
 */
function getOccupancyAdjustment(studentCount: number, season: Season): number {
  const adjustmentFactor = season === 'winter' ? 0.1 : 0.2;
  return (studentCount / 5) * adjustmentFactor;
}

/**
 * Calculate time-of-day adjustment
 * Morning (6-9): +0.5°C (students arriving, building warming up)
 * Midday (9-14): 0°C (baseline)
 * Afternoon (14-18): +0.3°C (peak occupancy, sun exposure)
 * Evening (18-22): -0.2°C (cooling down)
 * Night (22-6): -0.5°C (minimal occupancy)
 */
function getTimeOfDayAdjustment(date: Date = new Date()): number {
  const hour = date.getHours();

  if (hour >= 6 && hour < 9) return 0.5;
  if (hour >= 9 && hour < 14) return 0;
  if (hour >= 14 && hour < 18) return 0.3;
  if (hour >= 18 && hour < 22) return -0.2;
  return -0.5;
}

/**
 * Determine comfort status based on temperature difference
 * Comfortable: within ±0.5°C of target
 * Too hot: > 1°C above target
 * Too cold: > 1°C below target
 */
function getComfortStatus(
  currentTemperature: number,
  targetTemperature: number
): ComfortStatus {
  const difference = currentTemperature - targetTemperature;

  if (difference > 1.0) {
    return 'too_hot';
  } else if (difference < -1.0) {
    return 'too_cold';
  }
  return 'comfortable';
}

/**
 * Main calculation function
 * Returns the optimal temperature target and comfort status
 */
export function calculateOptimalTemperature(
  currentTemperature: number,
  studentCount: number,
  date: Date = new Date()
): TemperatureCalculationResult {
  const season = getSeason(date);
  const baseTemperature = getBaseTemperature(season);
  const occupancyAdjustment = getOccupancyAdjustment(studentCount, season);
  const timeAdjustment = getTimeOfDayAdjustment(date);

  const targetTemperature = baseTemperature - occupancyAdjustment + timeAdjustment;

  const minTemp = season === 'winter' ? 19 : 22;
  const maxTemp = season === 'winter' ? 25 : 28;
  const clampedTarget = Math.max(minTemp, Math.min(maxTemp, targetTemperature));

  const comfortStatus = getComfortStatus(currentTemperature, clampedTarget);

  const explanation = generateExplanation(
    season,
    studentCount,
    date,
    baseTemperature,
    occupancyAdjustment,
    timeAdjustment,
    comfortStatus
  );

  return {
    targetTemperature: Math.round(clampedTarget * 10) / 10,
    season,
    comfortStatus,
    explanation,
  };
}

/**
 * Generate human-readable explanation of the calculation
 */
function generateExplanation(
  season: Season,
  studentCount: number,
  date: Date,
  baseTemp: number,
  occupancyAdj: number,
  timeAdj: number,
  status: ComfortStatus
): string {
  const hour = date.getHours();
  const timeOfDay = getTimeOfDayLabel(hour);
  const seasonLabel = season === 'winter' ? 'Invierno' : 'Verano';

  let explanation = `${seasonLabel} - ${timeOfDay}. `;
  explanation += `Base: ${baseTemp}°C. `;
  explanation += `${studentCount} alumnos: -${occupancyAdj.toFixed(1)}°C. `;
  explanation += `Hora del día: ${timeAdj > 0 ? '+' : ''}${timeAdj.toFixed(1)}°C. `;

  if (status === 'comfortable') {
    explanation += 'Confort óptimo.';
  } else if (status === 'too_hot') {
    explanation += 'Demasiado calor - considere ventilar.';
  } else {
    explanation += 'Demasiado frío - considere calentar.';
  }

  return explanation;
}

/**
 * Get human-readable time of day label
 */
function getTimeOfDayLabel(hour: number): string {
  if (hour >= 6 && hour < 9) return 'Mañana';
  if (hour >= 9 && hour < 14) return 'Mediodía';
  if (hour >= 14 && hour < 18) return 'Tarde';
  if (hour >= 18 && hour < 22) return 'Noche';
  return 'Madrugada';
}

/**
 * Validate temperature reading
 * Returns true if the reading is within acceptable range
 */
export function isValidTemperatureReading(temperature: number): boolean {
  return temperature >= 5 && temperature <= 40;
}

/**
 * Get comfort status color for UI visualization
 */
export function getComfortStatusColor(status: ComfortStatus): string {
  switch (status) {
    case 'comfortable':
      return '#4ade80';
    case 'too_hot':
      return '#f87171';
    case 'too_cold':
      return '#60a5fa';
    default:
      return '#9ca3af';
  }
}

/**
 * Get comfort status label in Spanish
 */
export function getComfortStatusLabel(status: ComfortStatus): string {
  switch (status) {
    case 'comfortable':
      return 'Confortable';
    case 'too_hot':
      return 'Demasiado Calor';
    case 'too_cold':
      return 'Demasiado Frío';
    default:
      return 'Desconocido';
  }
}

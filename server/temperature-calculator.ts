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
  shouldEnableVentilation: boolean;
  recommendedFanSpeed: number;
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
 * Calculate ventilation requirements based on occupancy and comfort status
 * - No ventilation: comfortable or too cold
 * - Light ventilation (30%): slightly too hot (0.5-1°C above target)
 * - Medium ventilation (60%): moderately too hot (1-2°C above target)
 * - Full ventilation (100%): very hot (>2°C above target)
 */
function calculateVentilation(
  currentTemperature: number,
  targetTemperature: number,
  studentCount: number
): { shouldEnable: boolean; fanSpeed: number } {
  const temperatureDifference = currentTemperature - targetTemperature;

  // Base ventilation need on occupancy (more students = more CO2)
  const occupancyFactor = Math.min(studentCount / 30, 1); // Max at 30 students

  if (temperatureDifference > 2.0) {
    // Very hot - full ventilation
    return { shouldEnable: true, fanSpeed: 100 };
  } else if (temperatureDifference > 1.0) {
    // Moderately hot - medium ventilation
    return { shouldEnable: true, fanSpeed: Math.round(60 + occupancyFactor * 20) };
  } else if (temperatureDifference > 0.5) {
    // Slightly hot - light ventilation
    return { shouldEnable: true, fanSpeed: Math.round(30 + occupancyFactor * 20) };
  } else if (temperatureDifference < -1.0) {
    // Too cold - no ventilation
    return { shouldEnable: false, fanSpeed: 0 };
  } else {
    // Comfortable - minimal ventilation for air quality (based on occupancy)
    const minSpeed = Math.round(10 + occupancyFactor * 15);
    return { shouldEnable: occupancyFactor > 0.3, fanSpeed: minSpeed };
  }
}

/**
 * Generate explanation for the calculation
 */
function generateExplanation(
  season: Season,
  studentCount: number,
  date: Date,
  baseTemperature: number,
  occupancyAdjustment: number,
  timeAdjustment: number,
  comfortStatus: ComfortStatus
): string {
  const hour = date.getHours();
  const timeOfDay =
    hour >= 6 && hour < 9
      ? 'mañana'
      : hour >= 9 && hour < 14
        ? 'mediodía'
        : hour >= 14 && hour < 18
          ? 'tarde'
          : hour >= 18 && hour < 22
            ? 'noche'
            : 'madrugada';

  return `Temporada: ${season === 'winter' ? 'invierno' : 'verano'}, Alumnos: ${studentCount}, Hora: ${timeOfDay}, Estado: ${comfortStatus}`;
}

/**
 * Main calculation function
 * Returns the optimal temperature target, comfort status, and ventilation recommendations
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

  const ventilation = calculateVentilation(
    currentTemperature,
    clampedTarget,
    studentCount
  );

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
    targetTemperature: clampedTarget,
    season,
    comfortStatus,
    shouldEnableVentilation: ventilation.shouldEnable,
    recommendedFanSpeed: ventilation.fanSpeed,
    explanation,
  };
}

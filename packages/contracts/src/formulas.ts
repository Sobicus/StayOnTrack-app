import { FAT_KG_PER_KCAL, DEFAULT_WEIGHT_KG } from './constants';

/**
 * Calculate calories saved by avoiding (or partially avoiding) a habit occurrence.
 *
 * Formula: savedCalories = caloriesPerOccurrence * (1 - portionRatio)
 *
 * @param caloriesPerOccurrence - Total calories of one full occurrence of the habit
 * @param portionRatio - How much was consumed (0 = fully avoided, 1 = fully consumed)
 * @returns Calories saved
 */
export function getSavedCalories(caloriesPerOccurrence: number, portionRatio: number): number {
  return caloriesPerOccurrence * (1 - portionRatio);
}

/**
 * Calculate money saved by avoiding (or partially avoiding) a habit occurrence.
 *
 * Formula: savedMoney = pricePerOccurrence * (1 - portionRatio)
 *
 * @param pricePerOccurrence - Cost of one full occurrence of the habit
 * @param portionRatio - How much was consumed (0 = fully avoided, 1 = fully consumed)
 * @returns Money saved
 */
export function getSavedMoney(pricePerOccurrence: number, portionRatio: number): number {
  return pricePerOccurrence * (1 - portionRatio);
}

/**
 * Calculate potential weight avoided based on total saved calories.
 *
 * Approximately 7700 kcal equals 1 kg of body fat.
 *
 * Formula: potentialWeightAvoidedKg = totalSavedCalories / 7700
 *
 * @param totalSavedCalories - Cumulative calories saved over time
 * @returns Potential weight avoided in kilograms
 */
export function getPotentialWeightAvoided(totalSavedCalories: number): number {
  return totalSavedCalories / FAT_KG_PER_KCAL;
}

/**
 * Calculate calories burned per minute for a given activity using the MET formula.
 *
 * MET (Metabolic Equivalent of Task) represents the energy cost of physical activity.
 *
 * Formula: kcal/min = (MET * 3.5 * weightKg) / 200
 *
 * @param met - Metabolic Equivalent of Task value for the activity
 * @param weightKg - User's body weight in kilograms
 * @returns Calories burned per minute
 */
export function getCaloriesPerMinute(met: number, weightKg: number): number {
  return (met * 3.5 * weightKg) / 200;
}

/**
 * Calculate calories burned per rep, adjusted for user weight.
 *
 * Scales the base calories proportionally to the user's weight
 * relative to the base weight used when the value was measured.
 *
 * Formula: caloriesPerRep = baseCalories * (weightKg / baseWeightKg)
 *
 * @param baseCalories - Calories per rep at the base weight
 * @param weightKg - User's body weight in kilograms
 * @param baseWeightKg - Reference weight the base calories were measured at (defaults to 75 kg)
 * @returns Adjusted calories per rep for the user's weight
 */
export function getCaloriesPerRep(
  baseCalories: number,
  weightKg: number,
  baseWeightKg: number = DEFAULT_WEIGHT_KG,
): number {
  return baseCalories * (weightKg / baseWeightKg);
}

/**
 * Calculate the effort equivalent — how many units of an activity correspond
 * to the calories saved.
 *
 * Example: if you saved 300 kcal and running burns 10 kcal/min,
 * the equivalent is 30 minutes of running.
 *
 * Formula: equivalent = savedCalories / caloriesPerUnit
 *
 * @param savedCalories - Calories saved by avoiding the habit
 * @param caloriesPerUnit - Calories burned per unit (minute or rep) of the activity
 * @returns Number of activity units equivalent to the saved calories
 */
export function getActivityEquivalent(savedCalories: number, caloriesPerUnit: number): number {
  return savedCalories / caloriesPerUnit;
}

import { CustomSadhanaField } from "./types";

export function marksForValue(
  field: CustomSadhanaField,
  value: string | number | undefined
): number {
  if (value === undefined || value === "") return 0;

  if (field.type === "option") {
    return field.options?.find((option) => option.id === String(value))?.marks || 0;
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return (
    field.ranges?.find(
      (range) => numberValue >= range.min && numberValue <= range.max
    )?.marks || 0
  );
}

export function scoreResponse(
  fields: CustomSadhanaField[],
  values: Record<string, string | number>
) {
  return fields.reduce(
    (result, field) => {
      if (field.type === "number") return result;
      const marks = marksForValue(field, values[field.id]);
      return {
        score: result.score + marks,
        totalMarks: result.totalMarks + Math.max(
          0,
          field.type === "option"
            ? Math.max(...(field.options || []).map((option) => option.marks), 0)
            : Math.max(...(field.ranges || []).map((range) => range.marks), 0)
        ),
      };
    },
    { score: 0, totalMarks: 0 }
  );
}

/**
 * Weekly scoring rule:
 * - Choice fields are scored once for every submitted day.
 * - Number fields are added across the week, then matched against a range once.
 */
export function scoreWeeklyResponses(
  fields: CustomSadhanaField[],
  responses: Array<{ values: Record<string, string | number> }>,
  expectedDays = 7
) {
  return fields.reduce(
    (result, field) => {
      if (field.type === "option") {
        const dailyMaximum = Math.max(...(field.options || []).map((option) => option.marks), 0);
        return {
          score: result.score + responses.reduce((sum, response) => sum + marksForValue(field, response.values[field.id]), 0),
          totalMarks: result.totalMarks + dailyMaximum * expectedDays,
        };
      }

      const weeklyNumber = responses.reduce((sum, response) => sum + Number(response.values[field.id] || 0), 0);
      const weeklyMarks = marksForValue(field, weeklyNumber);
      const weeklyMaximum = Math.max(...(field.ranges || []).map((range) => range.marks), 0);
      return {
        score: result.score + weeklyMarks,
        totalMarks: result.totalMarks + weeklyMaximum,
      };
    },
    { score: 0, totalMarks: 0 }
  );
}
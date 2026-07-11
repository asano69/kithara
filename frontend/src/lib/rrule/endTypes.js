// Ported from react-rrule-builder-ts/src/components/End/End.types.tsx.

export const EndType = {
  NEVER: "never",
  AFTER: "after",
  ON: "on",
};

/**
 * Discriminated union, mirroring the original TypeScript EndDetails type.
 * @typedef {Object} EndDetails
 * @property {string} endingType - one of EndType
 * @property {number|null} [occurrences] - present when endingType is EndType.AFTER
 * @property {Date|null} [endDate] - present when endingType is EndType.ON
 */

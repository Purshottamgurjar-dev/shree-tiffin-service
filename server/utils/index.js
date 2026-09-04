// Utility functions placeholder
// Generators for human-readable order IDs (e.g., STS-2026-0001), formatters, validators.
export const generateOrderNumber = (sequence = 1) => {
  const year = new Date().getFullYear();
  const paddedSeq = String(sequence).padStart(4, '0');
  return `STS-${year}-${paddedSeq}`;
};

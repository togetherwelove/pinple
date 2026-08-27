import { ACCOUNT_SYNC, GROUPING_LIMITS } from "@/lib/config/app";

function transferSuffix(sequence: number) {
  const sequenceLabel = sequence > 1 ? ` ${sequence}` : "";

  return ` (${ACCOUNT_SYNC.transferredResultSuffix}${sequenceLabel})`;
}

function appendSuffix(name: string, suffix: string) {
  const maximumBaseLength =
    GROUPING_LIMITS.groupResultNameMaximumLength - suffix.length;

  return `${name.slice(0, maximumBaseLength).trimEnd()}${suffix}`;
}

export function createTransferredResultName(
  originalName: string,
  existingNames: Set<string>,
) {
  if (!existingNames.has(originalName)) {
    return originalName;
  }

  let sequence = 1;

  while (true) {
    const candidate = appendSuffix(originalName, transferSuffix(sequence));

    if (!existingNames.has(candidate)) {
      return candidate;
    }

    sequence += 1;
  }
}

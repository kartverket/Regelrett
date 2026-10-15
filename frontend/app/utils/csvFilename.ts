const MAX_FILENAME_LENGTH = 120;

function sanitizeForFileName(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/æ/g, "ae")
      .replace(/ø/g, "o")
      .replace(/å/g, "a")
      // Split each accented letter into a plain letter + accent mark
      .normalize("NFD")
      // delete accent marks, leaving only letters behind
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

export function buildContextCsvFilename(
  formName: string,
  contextName: string,
): string {
  return buildContextFilename(formName, contextName, ".csv");
}

export function buildContextXlsxFilename(
  formName: string,
  contextName: string,
): string {
  return buildContextFilename(formName, contextName, ".xlsx");
}

function buildContextFilename(
  formName: string,
  contextName: string,
  fileExtension: string,
): string {
  const baseName = sanitizeForFileName(`${formName}-${contextName}`);

  if (!baseName) {
    throw new Error("Filename could not be generated from form and context name");
  }

  const truncatedBaseName = baseName
    .slice(0, MAX_FILENAME_LENGTH - fileExtension.length)
    // Remove trailing dashes if truncation cut in the middle of a separator block.
    .replace(/-+$/g, "");

  if (!truncatedBaseName) {
    throw new Error("Filename became empty after truncation");
  }

  return `${truncatedBaseName}${fileExtension}`;
}

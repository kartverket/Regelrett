const FILE_EXTENSION = ".csv";
const MAX_FILENAME_LENGTH = 120;
const MAX_BASENAME_LENGTH = MAX_FILENAME_LENGTH - FILE_EXTENSION.length;

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
  const baseName = sanitizeForFileName(`${formName}-${contextName}`);

  if (!baseName) {
    throw new Error("CSV filename could not be generated from form and context name");
  }

  const truncatedBaseName = baseName
    .slice(0, MAX_BASENAME_LENGTH)
    // Remove trailing dashes if truncation cut in the middle of a separator block.
    .replace(/-+$/g, "");

  if (!truncatedBaseName) {
    throw new Error("CSV filename became empty after truncation");
  }

  return `${truncatedBaseName}${FILE_EXTENSION}`;
}


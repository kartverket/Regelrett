import { describe, expect, it } from "vitest";
import {
  buildContextCsvFilename,
  buildContextXlsxFilename,
} from "./csvFilename";

describe("buildContextCsvFilename", () => {
  it("bygger filnavn av formName og contextName", () => {
    expect(
      buildContextCsvFilename(
        "Sikkerhetskontrollere",
        "Skjemautfylling (Regelrett)",
      ),
    ).toBe("sikkerhetskontrollere-skjemautfylling-regelrett.csv");
  });

  it("normaliserer norske tegn og separatorer", () => {
    expect(
      buildContextCsvFilename("Tjenestenivå og driftskontinuitet", "Fylle ut skjema"),
    ).toBe("tjenesteniva-og-driftskontinuitet-fylle-ut-skjema.csv");
  });

  it("avkorter filnavn til maks 120 tegn inkludert extension", () => {
    const longFormName = "a".repeat(100);
    const longContextName = "b".repeat(100);

    const fileName = buildContextCsvFilename(longFormName, longContextName);

    expect(fileName.length).toBeLessThanOrEqual(120);
    expect(fileName.endsWith(".csv")).toBe(true);
  });

  it("kaster feil hvis input ikke gir gyldig filnavn", () => {
    expect(() => buildContextCsvFilename("!!!", "***")).toThrowError();
  });

  it("bygger XLSX-filnavn med samme normalisering", () => {
    expect(
      buildContextXlsxFilename(
        "Sikkerhetskontrollere",
        "Skjemautfylling (Regelrett)",
      ),
    ).toBe("sikkerhetskontrollere-skjemautfylling-regelrett.xlsx");
  });
});

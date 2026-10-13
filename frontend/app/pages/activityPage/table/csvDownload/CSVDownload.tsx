import { OptionalFieldType, type Column, type Question } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import ExcelJS from "exceljs";
import {
  buildContextCsvFilename,
  buildContextXlsxFilename,
} from "@/utils/csvFilename";
import { toast } from "sonner";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  rows: Question[];
  headerArray: string[];
  columns: Column[];
  formName: string;
  contextName: string;
}

export function CSVDownload({
  rows,
  headerArray,
  columns,
  formName,
  contextName,
  onClick,
  ...rest
}: Props) {
  const answerColumnName = columns.find((c) => c.answerable)?.name ?? "Svar";
  const valuesByRow = rows.map((row) =>
    headerArray.map((header) => getCellValue(row, header, answerColumnName)),
  );
  const csvRows = valuesByRow
    .map((values) => values.map(escapeCSVValue).join(","))
    .join("\n");

  const csvData = `${headerArray.join(",")}\n${csvRows}`;

  const handleDownload = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);

    try {
      const fileName = buildContextCsvFilename(formName, contextName);
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading context CSV:", error);
      toast.error("Å nei!", {
        description: "Det har skjedd en feil. Prøv på nytt",
        duration: 5000,
        id: "download-context-csv-error",
      });
    }
  };

  const handleXlsxDownload = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    onClick?.(event);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Svar");

      worksheet.addRow(headerArray);
      valuesByRow.forEach((values) => {
        worksheet.addRow(values.map((value) => formatXlsxValue(value)));
      });
      worksheet.getRow(1).font = { bold: true };
      worksheet.views = [{ state: "frozen", ySplit: 1 }];

      const fileName = buildContextXlsxFilename(formName, contextName);
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(blob, fileName);
    } catch (error) {
      console.error("Error downloading context XLSX:", error);
      toast.error("Å nei!", {
        description: "Det har skjedd en feil. Prøv på nytt",
        duration: 5000,
        id: "download-context-xlsx-error",
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        className="w-fit"
        onClick={handleDownload}
        {...rest}
      >
        <Download className="size-5" />
        Last ned CSV
      </Button>
      <Button
        variant="outline"
        className="w-fit"
        onClick={handleXlsxDownload}
        {...rest}
      >
        <Download className="size-5" />
        Last ned XLSX
      </Button>
    </div>
  );
}

function getCellValue(
  row: Question,
  header: string,
  answerColumnName: string,
): string | string[] {
  switch (header) {
    case answerColumnName:
      return row.answers.map((answer) => answer.answer);
    case "Kommentar":
      return row.comments.map((comment) => comment.comment);
    default: {
      const field = row.metadata.optionalFields?.find(
        (field) => field.key === header,
      );
      if (!field) return "";

      return field.type !== OptionalFieldType.OPTION_MULTIPLE &&
        field.value.length > 0
        ? field.value[0]
        : field.value;
    }
  }
}

const escapeCSVValue = (value: string | number | Array<string>): string => {
  if (typeof value === "string") {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      value = value.replace(/"/g, '""'); // Escape double quotes
      return `"${value}"`; // Wrap the value in quotes
    }
  }
  if (Array.isArray(value)) {
    const escapedArray = value.map(escapeCSVValue);
    return `${escapedArray.join("|")}`;
  }
  return String(value); // Return the value as a string
};

function formatXlsxValue(value: string | string[]): string {
  return Array.isArray(value) ? value.join("|") : value;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

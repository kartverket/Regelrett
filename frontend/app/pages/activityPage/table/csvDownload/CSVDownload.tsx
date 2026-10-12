import { OptionalFieldType, type Column, type Question } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { buildContextCsvFilename } from "@/utils/csvFilename";
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
  const csvRows = rows
    .map((row) =>
      headerArray
        .map((header) => {
          switch (header) {
            case answerColumnName:
              return escapeCSVValue(row.answers.map((answer) => answer.answer));
            case "Kommentar":
              return escapeCSVValue(
                row.comments.map((comment) => comment.comment),
              );
            default: {
              const field = row.metadata.optionalFields?.find(
                (field) => field.key === header,
              );
              if (!field) return "";
              const value =
                field.type !== OptionalFieldType.OPTION_MULTIPLE &&
                field.value.length > 0
                  ? field.value[0]
                  : field.value;
              return escapeCSVValue(value);
            }
          }
        })
        .join(","),
    )
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

  return (
    <Button variant="outline" className="w-fit" onClick={handleDownload} {...rest}>
      <Download className="size-5" />
      Last ned CSV
    </Button>
  );
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

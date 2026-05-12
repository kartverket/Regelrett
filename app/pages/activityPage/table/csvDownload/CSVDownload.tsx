import type { Question } from "../../../../api/types";
import { OptionalFieldType } from "../../../../api/types";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  rows: Question[];
  headerArray: string[];
  answerColumnName: string;
}

export function CSVDownload({ rows, headerArray, answerColumnName, ...rest }: Props) {
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
  const blob = new Blob([csvData], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);

  return (
    <a href={url} download="table_data.csv">
      <Button variant="outline" className="w-fit" {...rest}>
        <Download className="size-5" />
        Last ned CSV
      </Button>
    </a>
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

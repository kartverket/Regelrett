import type { Row } from "@tanstack/react-table";
import { AnswerCell } from "./AnswerCell";
import type { Column, Question, User } from "@/api/types";
import { OptionalFieldType } from "@/api/types";
import colorUtils from "@/utils/colorUtils";
import Markdown from "react-markdown";
import { markdownComponents } from "@/utils/markdownComponents";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router";

type Props = {
  contextId: string;
  value: Array<string>;
  column: Column;
  row: Row<Question>;
  answerable?: boolean;
  user: User;
};

export const TableCell = ({
  contextId,
  value,
  column,
  row,
  answerable = false,
  user,
}: Props) => {
  if (answerable) {
    return (
      <AnswerCell
        value={row.original.answers.at(-1)?.answer ?? ""}
        answerType={row.original.metadata?.answerMetadata.type}
        unit={row.original.answers.at(-1)?.answerUnit}
        units={row.original.metadata?.answerMetadata.units}
        recordId={row.original.recordId}
        contextId={contextId}
        questionId={row.original.id}
        comment={row.original.comments?.at(0)?.comment ?? ""}
        updated={row.original.answers.at(-1)?.updated}
        choices={row.original.metadata?.answerMetadata.options}
        options={column.options}
        user={user}
        answerExpiry={row.original.metadata?.answerMetadata.expiry}
      />
    );
  }

  if (value == null) {
    return <></>;
  }

  switch (column.type) {
    case OptionalFieldType.OPTION_MULTIPLE: {
      return (
        <div className="flex flex-wrap gap-1">
          {value
            .sort((a: string, b: string) => a.length - b.length)
            .map((text: string, index: number) => {
              return <Badge key={index}>{text}</Badge>;
            })}
        </div>
      );
    }
    case OptionalFieldType.OPTION_SINGLE: {
      const backgroundColor = column.options?.find(
        (option) => option.name === value[0],
      )?.color;

      const backgroundColorHex = colorUtils.getHexForColor(
        backgroundColor ?? "grayLight1",
      );
      const useWhiteTextColor = colorUtils.shouldUseLightTextOnColor(
        backgroundColor ?? "grayLight1",
      );

      return (
        <Badge
          style={{
            backgroundColor: backgroundColorHex ?? "#FFFFFF",
          }}
          className={`text-${useWhiteTextColor ? "white" : "black"}`}
        >
          {value[0]}
        </Badge>
      );
    }
  }

  if (column.name === "Kortnavn" || column.name === "Navn") {
    return (
      <div className="max-w-[650px] whitespace-normal">
        <Link
          to={row.original.recordId}
          aria-label="Se detaljer"
          className="p-0 text-sm h-0 whitespace-normal text-left text-primary hover:underline"
        >
          {value[0]}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[650px] whitespace-normal text-sm">
      <Markdown components={markdownComponents}>
        {value[0].split("\n\n")[0]}
      </Markdown>
    </div>
  );
};

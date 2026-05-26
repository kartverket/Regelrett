import type { Question } from "../../api/types";
import { OptionalFieldType } from "../../api/types";
import Markdown from "react-markdown";
import { markdownComponents } from "../../utils/markdownComponents";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { useFetchColumns } from "../../hooks/useFetchColumns";
import colorUtils from "../../utils/colorUtils";
import { formatDateTime, isOlderThan } from "../../utils/formatTime";
import { Badge } from "../../components/ui/badge";

type Props = {
  question: Question;
  answerUpdated: Date | undefined;
  formId: string;
};

type Value = {
  value: string;
  backgroundColor: string | null;
  useWhiteText: boolean;
};

type FieldData = {
  key: string;
  value: Value[];
};

export function QuestionDetails({ question, answerUpdated, formId }: Props) {
  const {
    data: columns,
    error: columnsError,
    isPending: columnsIsLoading,
  } = useFetchColumns(formId);

  if (columnsIsLoading) return <LoadingState />;
  if (columnsError)
    return <ErrorState message="Noe gikk galt, prøv gjerne igjen" />;

  const findFieldValue = (key: string): string[] | undefined =>
    question.metadata.optionalFields?.find((field) => field.key === key)?.value;

  const getBackgroundColor = (key: string, value: string): string =>
    columns
      .find((column) => column.name === key)
      ?.options?.find((option) => option.name === value)?.color ?? "grayLight1";

  const fieldData: FieldData[] | undefined = question.metadata.optionalFields
    ?.slice(3)
    .map((field) => {
      const fieldValue = findFieldValue(field.key) || ["Ikke oppgitt"];
      return {
        key: field.key,
        value: fieldValue.map((value) => {
          const airtableColor = getBackgroundColor(field.key, value);
          const shouldUseWhiteText =
            colorUtils.shouldUseLightTextOnColor(airtableColor);

          return {
            value: value,
            backgroundColor: colorUtils.getHexForColor(airtableColor),
            useWhiteText: shouldUseWhiteText,
          };
        }),
      };
    });

  const nameColumn = columns.find((col) => col.isName);
  const questionName = nameColumn
    ? (findFieldValue(nameColumn.name)?.[0] ?? question.question)
    : question.question;

  const descriptionColumn = columns.find(
    (col) =>
      col.type === OptionalFieldType.TEXT && !col.isName && !col.answerable,
  );
  const description = descriptionColumn
    ? (findFieldValue(descriptionColumn.name)?.[0] ?? question.question)
    : question.question;

  return (
    <div className="space-y-1">
      <p>{question.id}</p>
      <p className="text-2xl font-bold">{questionName}</p>
      <div className="flex flex-col gap-4 py-5">
        {fieldData?.map((field) => (
          <div className="flex items-center gap-4" key={field.key}>
            <div className="font-bold min-w-24">{field.key}:</div>
            <div className="flex flex-row gap-1">
              {field.value?.map((value) => (
                <Badge
                  style={{
                    backgroundColor: value.backgroundColor ?? "#FFFFFF",
                  }}
                  className={`text-${value.useWhiteText ? "white" : "black"}`}
                  key={value.value}
                >
                  {value.value}
                </Badge>
              ))}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-4">
          <p className="font-bold min-w-24">Sist endret:</p>
          <p
            className={
              isOlderThan(
                answerUpdated ?? new Date(),
                question.metadata.answerMetadata.expiry,
              )
                ? "text-destructive"
                : "text-black"
            }
          >
            {answerUpdated ? formatDateTime(answerUpdated) : "Aldri"}
          </p>
        </div>
      </div>
      <div className="bg-secondary p-4 rounded-xl">
        <p className="font-bold">Beskrivelse:</p>
        <Markdown components={markdownComponents}>{description}</Markdown>
      </div>
    </div>
  );
}

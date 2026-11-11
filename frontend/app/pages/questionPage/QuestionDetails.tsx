import type { Answer, Question, User } from "../../api/types";
import { RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useSubmitAnswer } from "../../hooks/useAnswers";
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
  latestAnswer: Answer | undefined;
  formId: string;
  contextId: string;
  user: User;
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

export function QuestionDetails({
  question,
  latestAnswer,
  formId,
  contextId,
  user,
}: Props) {
  const {
    data: columns,
    error: columnsError,
    isPending: columnsIsLoading,
  } = useFetchColumns(formId);
  const { mutate: submitAnswer } = useSubmitAnswer(
    contextId,
    question.recordId,
  );
  const answerUpdated = latestAnswer?.updated;

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

  const questionName = question.name ?? question.id;

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
        {latestAnswer && (
          <Button
            aria-label="Forny svaret"
            className="flex justify-start has-[>svg]:px-0 w-fit text-xs"
            variant={"link"}
            size="sm"
            onClick={() => {
              submitAnswer({
                actor: user.id,
                recordId: question.recordId,
                questionId: question.id,
                answer: latestAnswer.answer,
                answerUnit: latestAnswer.answerUnit,
                answerType: question.metadata.answerMetadata.type,
                contextId: contextId,
              });
            }}
          >
            Forny svar
            <RefreshCw />
          </Button>
        )}
      </div>
      <div className="bg-secondary p-4 rounded-xl">
        <p className="font-bold">Beskrivelse:</p>
        <Markdown components={markdownComponents}>{question.description}</Markdown>
      </div>
    </div>
  );
}

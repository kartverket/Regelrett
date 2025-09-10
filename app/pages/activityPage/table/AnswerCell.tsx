import { useState } from "react";
import type { User } from "@/api/types";
import { AnswerType } from "@/api/types";
import type { Option } from "@/api/types";
import { PercentAnswer } from "@/components/answers/PercentAnswer";
import { TimeAnswer } from "@/components/answers/TimeAnswer";
import { TextAnswer } from "@/components/answers/TextAnswer";
import { SingleSelectAnswer } from "@/components/answers/SingleSelectAnswer";
import { CheckboxAnswer } from "@/components/answers/CheckboxAnswer";
import { useSubmitAnswer } from "@/hooks/useAnswers";
import { useIsMutating } from "@tanstack/react-query";
import MultiSelectAnswer from "@/components/answers/MultiSelectAnswer";

type Props = {
  value: string | undefined;
  answerType: AnswerType;
  unit?: string;
  units?: string[] | null;
  questionId: string;
  recordId: string;
  contextId: string;
  comment: string;
  updated?: Date;
  choices?: string[] | null;
  options?: Option[] | null;
  user: User;
  answerExpiry: number | null;
};

export function AnswerCell({
  value,
  answerType,
  unit,
  units,
  questionId,
  recordId,
  contextId,
  updated,
  choices,
  options,
  user,
  answerExpiry,
}: Props) {
  const [answerInput, setAnswerInput] = useState<string | undefined>(value);
  const [answerUnit, setAnswerUnit] = useState<string | undefined>(unit);

  const { mutate: submitAnswerHook } = useSubmitAnswer(contextId, recordId);
  const isMutating = useIsMutating({
    mutationKey: ["answers", contextId, recordId],
  });
  const isDisabled = isMutating !== 0;

  const submitAnswer = (newAnswer: string, unitAnswer?: string) => {
    submitAnswerHook({
      actor: user.id,
      recordId: recordId,
      questionId: questionId,
      answer: newAnswer,
      answerUnit: unitAnswer,
      answerType: answerType,
      contextId: contextId,
    });
  };

  switch (answerType) {
    case AnswerType.TEXT_MULTI_LINE:
    case AnswerType.TEXT_SINGLE_LINE:
      return (
        <TextAnswer
          multipleLines={answerType === AnswerType.TEXT_MULTI_LINE}
          value={answerInput}
          updated={updated}
          setAnswerInput={setAnswerInput}
          submitAnswer={submitAnswer}
          answerExpiry={answerExpiry}
          disabled={isDisabled}
        />
      );
    case AnswerType.SELECT_SINGLE:
      return (
        <SingleSelectAnswer
          value={answerInput}
          updated={updated}
          choices={choices}
          options={options}
          setAnswerInput={setAnswerInput}
          submitAnswer={submitAnswer}
          answerExpiry={answerExpiry}
          disabled={isDisabled}
        />
      );
    case AnswerType.SELECT_MULTIPLE:
      return (
        <MultiSelectAnswer
          choices={choices}
          value={answerInput}
          submitAnswer={submitAnswer}
          disabled={isDisabled}
          updated={updated}
          answerExpiry={answerExpiry}
        />
      );
    case AnswerType.PERCENT:
      return (
        <PercentAnswer
          value={answerInput}
          updated={updated}
          setAnswerInput={setAnswerInput}
          submitAnswer={submitAnswer}
          isActivityPageView
          answerExpiry={answerExpiry}
          disabled={isDisabled}
        />
      );
    case AnswerType.TIME:
      return (
        <TimeAnswer
          value={answerInput}
          unit={answerUnit}
          units={units}
          updated={updated}
          setAnswerInput={setAnswerInput}
          setAnswerUnit={setAnswerUnit}
          submitAnswer={submitAnswer}
          isActivityPageView
          answerExpiry={answerExpiry}
          disabled={isDisabled}
        />
      );
    case AnswerType.CHECKBOX:
      return (
        <CheckboxAnswer
          value={answerInput}
          updated={updated}
          setAnswerInput={setAnswerInput}
          submitAnswer={submitAnswer}
          choices={choices}
          isActivityPageView
          answerExpiry={answerExpiry}
          disabled={isDisabled}
        />
      );
    default:
      return <p>Ukjent svartype</p>;
  }
}

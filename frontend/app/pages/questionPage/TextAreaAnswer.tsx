import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  latestAnswer: string;
  submitAnswer: (newAnswer: string) => void;
  disabled?: boolean;
};

export function TextAreaAnswer({
  latestAnswer,
  submitAnswer,
  disabled,
}: Props) {
  const [answerInput, setAnswerInput] = useState<string | undefined>(
    latestAnswer,
  );

  useEffect(() => {
    setAnswerInput(latestAnswer);
  }, [latestAnswer]);

  return (
    <Textarea
      value={answerInput}
      onChange={(e) => setAnswerInput(e.target.value)}
      className="w-1/2 resize-y bg-card"
      onBlur={() => {
        if (answerInput !== latestAnswer) {
          submitAnswer(answerInput ?? "");
        }
      }}
      disabled={disabled}
    />
  );
}

import { LastUpdated } from "../LastUpdated";
import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  value: string | undefined;
  updated?: Date;
  multipleLines?: boolean;
  setAnswerInput: React.Dispatch<React.SetStateAction<string | undefined>>;
  submitAnswer: (newAnswer: string) => void;
  answerExpiry: number | null;
  disabled?: boolean;
};

export function TextAnswer({
  value,
  updated,
  multipleLines,
  setAnswerInput,
  submitAnswer,
  answerExpiry,
  disabled,
}: Props) {
  const initialValue = useRef(value).current;

  return (
    <div className="flex flex-col min-w-[200px]">
      <div className="flex flex-row items-center gap-2">
        {multipleLines ? (
          <Textarea
            value={value}
            onChange={(e) => setAnswerInput(e.target.value)}
            onBlur={() => {
              if (value !== initialValue) {
                submitAnswer(value ?? "");
              }
            }}
            disabled={disabled}
            className="bg-card"
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => setAnswerInput(e.target.value)}
            onBlur={() => {
              if (value != initialValue) {
                submitAnswer(value ?? "");
              }
            }}
            disabled={disabled}
            className="bg-card"
          />
        )}
      </div>

      <LastUpdated
        updated={updated}
        answerExpiry={answerExpiry}
        submitAnswer={submitAnswer}
        value={value}
        disabled={disabled}
      />
    </div>
  );
}

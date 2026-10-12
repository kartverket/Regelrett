import { LastUpdated } from "../LastUpdated";
import { useRef } from "react";
import { Input } from "@/components/ui/input";

type Props = {
  value: string | undefined;
  updated?: Date;
  setAnswerInput: React.Dispatch<React.SetStateAction<string | undefined>>;
  submitAnswer: (newAnswer: string) => void;
  isActivityPageView?: boolean;
  answerExpiry: number | null;
  disabled?: boolean;
};

export function PercentAnswer({
  value,
  updated,
  setAnswerInput,
  submitAnswer,
  isActivityPageView = false,
  answerExpiry,
  disabled,
}: Props) {
  const initialValue = useRef(value).current;

  const handlePercentAnswer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const numericValue = Number(value);
    if (
      !isNaN(numericValue) &&
      numericValue >= 0 &&
      numericValue <= 100 &&
      value.length <= 7
    ) {
      setAnswerInput(value);
    }
  };

  return (
    <div className="flex flex-col w-[170px] max-w-[250px]">
      <div className="flex flex-row gap-2">
        <div className="relative ">
          <Input
            value={value}
            onChange={handlePercentAnswer}
            onBlur={() => {
              if (value != initialValue) {
                submitAnswer(value ?? "");
              }
            }}
            disabled={disabled}
            className="bg-card pr-6"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            %
          </span>
        </div>
      </div>
      {isActivityPageView && (
        <LastUpdated
          updated={updated}
          answerExpiry={answerExpiry}
          submitAnswer={submitAnswer}
          value={value}
          disabled={disabled}
        />
      )}
    </div>
  );
}

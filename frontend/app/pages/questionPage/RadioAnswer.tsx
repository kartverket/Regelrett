import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Question } from "../../api/types";

type Props = {
  question: Question;
  latestAnswer: string;
  submitAnswer: (newAnswer: string) => void;
  disabled?: boolean;
};

export function RadioAnswer({
  question,
  latestAnswer,
  submitAnswer,
  disabled,
}: Props) {
  const { options } = question.metadata.answerMetadata;

  return (
    <div className="flex flex-col gap-2">
      <RadioGroup
        defaultValue={latestAnswer}
        onValueChange={(value) => submitAnswer(value ?? "")}
        className="flex flex-col"
        disabled={disabled}
      >
        {options?.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <RadioGroupItem value={option} id={option} />
            <Label htmlFor={option}>{option}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

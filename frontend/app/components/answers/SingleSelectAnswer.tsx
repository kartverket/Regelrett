import type { Option } from "../../api/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LastUpdated } from "../LastUpdated";
import colorUtils from "../../utils/colorUtils";

type Props = {
  value: string | undefined;
  updated?: Date;
  choices?: string[] | null;
  options?: Option[] | null;
  setAnswerInput: React.Dispatch<React.SetStateAction<string | undefined>>;
  submitAnswer: (newAnswer: string) => void;
  answerExpiry: number | null;
  disabled?: boolean;
};

export function SingleSelectAnswer({
  updated,
  value,
  choices,
  options,
  setAnswerInput,
  submitAnswer,
  answerExpiry,
  disabled,
}: Props) {
  if (!choices)
    throw new Error(`Failed to fetch choices for single selection answer cell`);

  const selectedColor = options?.find((option) => option.name === value)?.color;

  const selectedAnswerBackgroundColor = selectedColor
    ? (colorUtils.getHexForColor(selectedColor) ?? "white")
    : "white";

  return (
    <div className="flex flex-col mb-6 last:mb-0 w-[170px] max-w-[250px]">
      <Select
        disabled={disabled}
        value={value}
        onValueChange={(newValue: string) => {
          setAnswerInput(newValue);
          submitAnswer(newValue ?? "");
        }}
      >
        <SelectTrigger
          className="w-[100%]"
          style={{ backgroundColor: selectedAnswerBackgroundColor }}
        >
          <SelectValue placeholder="Velg alternativ" />
        </SelectTrigger>
        <SelectContent>
          {choices.map((choice) => (
            <SelectItem key={choice} value={choice}>
              {choice}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <LastUpdated
        updated={updated}
        submitAnswer={submitAnswer}
        value={value}
        answerExpiry={answerExpiry}
        disabled={disabled}
      />
    </div>
  );
}

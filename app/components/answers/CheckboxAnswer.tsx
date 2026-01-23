import { LastUpdated } from "../LastUpdated";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Props = {
  value: string | undefined;
  updated?: Date;
  setAnswerInput: React.Dispatch<React.SetStateAction<string | undefined>>;
  submitAnswer: (newAnswer: string) => void;
  choices?: string[] | null;
  isActivityPageView?: boolean;
  answerExpiry: number | null;
  disabled?: boolean;
};

export function CheckboxAnswer({
  value,
  updated,
  setAnswerInput,
  submitAnswer,
  choices,
  isActivityPageView = false,
  answerExpiry,
  disabled,
}: Props) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id="custom-checkbox"
        checked={value === (choices?.[0] ?? "checked")}
        onCheckedChange={(checked) => {
          const newValue = checked
            ? (choices?.[0] ?? "checked")
            : (choices?.[1] ?? "unchecked");
          setAnswerInput(newValue);
          submitAnswer(newValue);
        }}
        disabled={disabled}
      />
      <Label htmlFor="custom-checkbox" className="text-sm">
        {choices?.length === 2 && value
          ? value === (choices?.[0] ?? "checked")
            ? choices[0]
            : choices[1]
          : ""}
      </Label>
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

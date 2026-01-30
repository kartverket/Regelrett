import { LastUpdated } from "../LastUpdated";
import { useEffect, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type Props = {
  value: string | undefined;
  unit?: string;
  units?: string[] | null;
  updated?: Date;
  setAnswerInput: React.Dispatch<React.SetStateAction<string | undefined>>;
  setAnswerUnit: React.Dispatch<React.SetStateAction<string | undefined>>;
  submitAnswer: (newAnswer: string, unit?: string) => void;
  isActivityPageView?: boolean;
  answerExpiry: number | null;
  disabled?: boolean;
};

export function TimeAnswer({
  updated,
  value,
  unit,
  units,
  setAnswerInput,
  setAnswerUnit,
  submitAnswer,
  isActivityPageView = false,
  answerExpiry,
  disabled,
}: Props) {
  const initialValue = useRef(value).current;
  const initialUnit = useRef(unit).current;

  useEffect(() => {
    if (!unit && units && units.length > 0) {
      setAnswerUnit(units[0]);
    }
  }, [unit, units, setAnswerUnit]);

  const handleTimeAnswerValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const numericValue = Number(value);
    if (!isNaN(numericValue) && numericValue >= 0 && value.length <= 4) {
      setAnswerInput(value);
    }
  };

  const unitList = units ?? [];

  const UnitSelect = () => {
    return (
      <Select
        disabled={disabled}
        value={unit ?? unitList[0]}
        onValueChange={(selectedUnit) => {
          setAnswerUnit(selectedUnit);
          if (value) {
            submitAnswer(value, selectedUnit);
          }
        }}
      >
        <SelectTrigger className="w-auto text-sm -mr-1 bg-transparent shadow-none border-none focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {unitList.map((u) => (
            <SelectItem key={u} value={u}>
              {u}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="flex flex-col w-[170px]">
      <div className="relative">
        <Input
          value={value}
          onChange={handleTimeAnswerValue}
          onBlur={() => {
            if (value !== initialValue || unit !== initialUnit) {
              submitAnswer(value ?? "", unit);
            }
          }}
          disabled={disabled}
          className="bg-card pr-16"
        />

        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <UnitSelect />
        </div>
      </div>

      {isActivityPageView && (
        <LastUpdated
          updated={updated}
          answerExpiry={answerExpiry}
          submitAnswer={submitAnswer}
          value={value}
          unitAnswer={unit}
          disabled={disabled}
        />
      )}
    </div>
  );
}

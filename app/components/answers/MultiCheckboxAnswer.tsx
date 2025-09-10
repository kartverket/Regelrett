import { useCallback, useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LastUpdated } from "@/components/LastUpdated";

type Props = {
  value: string | undefined;
  choices: string[] | null | undefined;
  submitAnswer: (newAnswer: string) => void;
  disabled: boolean;
  updated?: Date;
  answerExpiry: number | null;
};

export default function MultiCheckboxAnswer({
  value,
  choices,
  submitAnswer,
  disabled,
  updated,
  answerExpiry,
}: Props) {
  const [savedAnswer, setSavedAnswer] = useState(value);
  const [selected, setSelected] = useState<string[]>(
    value?.split(";").map((val) => val.trim()) ?? [],
  );
  const [updatedAt, setUpdatedAt] = useState(updated);

  const submitIfModified = useCallback(
    (newAnswer: string) => {
      console.log("submitting", newAnswer);
      if (newAnswer != savedAnswer) {
        submitAnswer(newAnswer);
        setUpdatedAt(new Date());
        setSavedAnswer(newAnswer);
      }
    },
    [savedAnswer, submitAnswer],
  );

  useEffect(() => {
    console.log("effect", selected);
    const handler = setTimeout(
      () => submitIfModified(selected.join(";")),
      1500,
    );

    return () => clearTimeout(handler);
  }, [selected, submitIfModified]);

  return (
    <div className="flex flex-col gap-1">
      {choices?.map((choice) => (
        <div className="flex items-start gap-3" key={choice}>
          <Checkbox
            id={choice}
            checked={selected.includes(choice)}
            disabled={disabled}
            onCheckedChange={(checked) => {
              setSelected((current) => {
                let newSelected: string[];
                if (checked) {
                  newSelected = [...current, choice];
                } else {
                  newSelected = current.filter((val) => val != choice);
                }
                return newSelected;
              });
            }}
          />
          <Label htmlFor={choice} className="text-sm">
            {choice}
          </Label>
        </div>
      ))}
      <LastUpdated
        updated={updatedAt}
        submitAnswer={(newAnswer) => {
          submitAnswer(newAnswer);
          setUpdatedAt(new Date());
        }}
        value={selected.join(";")}
        answerExpiry={answerExpiry}
      />
    </div>
  );
}

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { LastUpdated } from "../LastUpdated";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useDebounce } from "@/hooks/useDebounce";
// import { setTimeout } from "typescript";

type Props = {
  value: string | undefined;
  choices: string[] | null | undefined;
  submitAnswer: (newAnswer: string) => void;
  disabled: boolean;
  updated?: Date;
  answerExpiry: number | null;
};

export default function MultiDropdownMenuAnswer({
  value,
  choices,
  submitAnswer,
  disabled,
  updated,
  answerExpiry,
}: Props) {
  const [open, setOpen] = useState(false);
  const [savedAnswer, setSavedAnswer] = useState(value);
  const [closeMenuTimeout, setCloseMenuTimeout] = useState<number>();
  const [debounceTimeout, setDebonceTimeout] = useState<number>();
  const [updatedAt, setUpdatedAt] = useState(updated);
  const [selected, setSelected] = useState<string[]>(
    value?.split(";").map((val) => val.trim()) ?? [],
  );

  function submitIfModified(newAnswer: string) {
    if (newAnswer != savedAnswer) {
      submitAnswer(newAnswer);
      setUpdatedAt(new Date());
      setSavedAnswer(newAnswer);
    }
  }

  function debouncedSubmit(newAnswer: string) {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    const to = setTimeout(
      (() => submitIfModified(newAnswer)) as TimerHandler,
      1500,
    );
    setDebonceTimeout(to);
  }

  return (
    <div>
      <DropdownMenu open={open} modal={false} onOpenChange={setOpen}>
        <div className="flex gap-1">
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-auto bg-transparent grow"
              disabled={disabled}
            >
              <Plus />
            </Button>
          </DropdownMenuTrigger>
          <div className="flex flex-col flex-wrap gap-0.5">
            {selected.map((choice) => (
              <Badge
                variant="outline"
                role="button"
                onClick={() => {
                  setSelected((current) => {
                    const newSelection = current.filter((s) => s !== choice);

                    return newSelection;
                  });
                  debouncedSubmit(
                    selected.filter((s) => s != choice).join(";"),
                  );
                }}
                className="bg-accent hover:bg-transparent group"
                key={choice}
              >
                {choice.slice(0, 20)}
                {choice.length > 50 ? "..." : null}
                <X className="group-hover:scale-140 group-hover:text-destructive h-auto w-auto" />
              </Badge>
            ))}
          </div>
        </div>
        <DropdownMenuContent
          onMouseEnter={() => clearTimeout(closeMenuTimeout)}
          onCloseAutoFocus={() => {
            submitIfModified(selected.join(";"));
          }}
          onMouseLeave={() => {
            setCloseMenuTimeout(
              setTimeout((() => setOpen(false)) as TimerHandler, 500),
            );
          }}
        >
          {choices?.map((choice) => (
            <DropdownMenuCheckboxItem
              key={choice}
              checked={selected.includes(choice)}
              onSelect={(e) => {
                e.preventDefault();
              }}
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
            >
              {choice}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

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

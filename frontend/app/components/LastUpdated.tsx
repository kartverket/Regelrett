import { formatDateTime, isOlderThan } from "../utils/formatTime";
import { Button } from "./ui/button";
import { RotateCw, TriangleAlert } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  updated?: Date;
  submitAnswer?: (newAnswer: string, unit?: string) => void;
  value?: string | undefined;
  unitAnswer?: string;
  answerExpiry?: number | null;
  isComment?: boolean;
  disabled?: boolean;
};

export function LastUpdated({
  updated,
  submitAnswer,
  value,
  unitAnswer,
  answerExpiry,
  isComment,
  disabled
}: Props) {
  if (!updated) return null;

  return (
    <div className="flex flex-row gap-1.5 content-center justify-between">
      <div className="flex flex-row gap-1">
        {!isComment && isOlderThan(updated, answerExpiry) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <TriangleAlert className="self-center" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Svaret er utløpt, og bør oppdateres</p>
            </TooltipContent>
          </Tooltip>
        )}
        <div className="flex flex-col">
          <p className="text-muted-foreground text-[0.625rem]">Sist endret</p>
          <p className="text-wrap text-xs">{formatDateTime(updated)}</p>
        </div>
      </div>
      {!isComment && submitAnswer && (
        <Button
          aria-label="Forny svaret"
          color="black"
          variant="link"
          size="sm"
          onClick={() => {
            submitAnswer(value ?? "", unitAnswer);
          }}
          className="self-center has-[>svg]:px-0"
          disabled={disabled}
        >
          <RotateCw />
          Forny svar
        </Button>
      )}
    </div>
  );
}

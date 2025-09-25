import { useContext } from "@/hooks/useContext";
import { Link as ReactRouterLink } from "react-router";
import { DeleteContextModal } from "@/pages/frontPage/DeleteContextModal";
import { ProgressCircle } from "@/pages/frontPage/ProgressCircle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useAnswers } from "@/hooks/useAnswers";

export function ContextLink({
  contextId,
  formId,
}: {
  contextId: string;
  formId: string;
}) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  function TruncatedText({
    str,
    maxLength,
  }: {
    str: string;
    maxLength: number;
  }) {
    if (str.length > maxLength) {
      return (
        <Tooltip>
          <TooltipTrigger>
            <p className="font-semibold text-xl">
              {str.slice(0, maxLength)}...
            </p>
          </TooltipTrigger>
          <TooltipContent>{str}</TooltipContent>
        </Tooltip>
      );
    } else {
      return <p className="font-semibold text-xl align">{str}</p>;
    }
  }

  const { data: context, isPending: contextIsPending } = useContext(contextId);
  const { data: answers, isPending: answerIsPending } = useAnswers(contextId);

  const latest = answers?.length
    ? answers.reduce((latest, current) =>
        new Date(current.updated) > new Date(latest.updated) ? current : latest,
      )
    : undefined;

  return (
    <SkeletonLoader
      loading={contextIsPending}
      width="w-[450px]"
      height="h-[98px]"
    >
      {context && (
        <ReactRouterLink
          to={`/context/${contextId}?${JSON.parse(
            localStorage.getItem(`filters_${context.formId}`) || `[]`,
          )
            .map(
              (filter: { id: string; value: string }) =>
                `filter=${filter.id}_${filter.value}`,
            )
            .join("&")}`}
        >
          <Card className="min-w-[450px] py-4 transition hover:bg-primary-foreground hover:shadow-md">
            <CardContent className="w-full self-start">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1 items-start">
                  <div className="flex items-center gap-1">
                    <TruncatedText str={context?.name ?? ""} maxLength={22} />
                    <Button
                      aria-label="Slett utfylling"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDeleteOpen(true);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <SkeletonLoader
                    loading={answerIsPending}
                    width="w-[450px]"
                    height="h-[98px]"
                  >
                    <p className="text-xs text-muted-foreground">
                      Sist endret:{" "}
                      {latest
                        ? latest.updated.toLocaleDateString("nb-NO")
                        : "aldri"}
                    </p>
                  </SkeletonLoader>
                </div>
                <ProgressCircle contextId={contextId} formId={formId} />
              </div>
            </CardContent>
          </Card>
        </ReactRouterLink>
      )}
      <DeleteContextModal
        onClose={() => setIsDeleteOpen(false)}
        isOpen={isDeleteOpen}
        teamId={context?.teamId ?? ""}
        contextId={contextId}
        formId={formId}
      />
    </SkeletonLoader>
  );
}

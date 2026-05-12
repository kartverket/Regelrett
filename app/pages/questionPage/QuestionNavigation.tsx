import { Button } from "@/components/ui/button";
import { useAnswers } from "@/hooks/useAnswers";
import { useComments } from "@/hooks/useComments";
import { useForm } from "@/hooks/useForm";
import { mapTableDataRecords } from "@/utils/mapperUtil";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { getSortFuncForColumn } from "../activityPage/table/TableSort";
import type { Question } from "@/api/types";
import { Link } from "react-router";
import { Spinner } from "@/components/Spinner";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function QuestionNavigation({
  formId,
  recordId,
  contextId,
}: {
  formId: string;
  recordId: string;
  contextId: string;
}) {
  const formQuery = useForm(formId);
  const allAnswersQuery = useAnswers(contextId);
  const allCommentsQuery = useComments(contextId);

  const disabled =
    formQuery.isPending ||
    allAnswersQuery.isPending ||
    allCommentsQuery.isPending ||
    formQuery.error != null ||
    allAnswersQuery.error != null ||
    allCommentsQuery.error != null;
  if (disabled) return <Spinner />;

  const filterState = getFilterState(formQuery);
  const sortingState = getSortingState(formQuery);

  const answerColumnName = formQuery.data.answerColumnName;

  let records = mapTableDataRecords(
    formQuery.data,
    allCommentsQuery.data,
    allAnswersQuery.data,
  );

  if (filterState.length > 0) {
    records = records.filter(getFilterFn(filterState, answerColumnName));
  }

  if (sortingState[0]?.id != undefined) {
    records.sort(sortQuestionsFn(sortingState[0].id, answerColumnName));
  }

  if (sortingState[0]?.desc) {
    records.reverse();
  }

  const index = records.findIndex((question) => question.recordId === recordId);
  const prev = index > 0 ? records[index - 1] : undefined;
  const next = index < records.length - 1 ? records[index + 1] : undefined;

  return (
    <>
      <Badge variant="secondary">
        {index + 1} av {records.length}
      </Badge>
      <div className="flex fixed h-16 lg:h-24 bottom-0 left-0 right-0 justify-between w-full bg-background shadow-[0px_0px_10px_20px_var(--background)]   lg:shadow-none lg:bg-transparent">
        {prev != undefined ? (
          <Link className="flex" relative="path" to={`../${prev.recordId}`}>
            <Button
              className="h-full px-8! font-bold hover:text-primary text-primary hover:bg-primary/10"
              variant="ghost"
              size="lg"
            >
              <ArrowLeft className={"size-10"} />
              FORRIGE
            </Button>
          </Link>
        ) : (
          <div />
        )}
        {next != undefined ? (
          <Link relative="path" to={`../${next.recordId}`}>
            <Button
              className="h-full px-8! font-bold hover:text-primary text-primary hover:bg-primary/10"
              variant="ghost"
              size="lg"
            >
              NESTE
              <ArrowRight className={"size-10"} />
            </Button>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </>
  );
}

function getSortingState(
  formQuery: UseQueryResult<{ id: string }>,
): SortingState {
  if (formQuery.isPending || formQuery.error) return [];
  return JSON.parse(
    localStorage.getItem(`sortingState_${formQuery.data.id}`) || "[]",
  );
}

function getSortValue(question: Question, sortColummn: string, answerColumnName: string): string {
  switch (sortColummn) {
    case "Kommentar":
      return question.comments.at(-1)?.comment ?? "";
    case answerColumnName:
      return question.answers.at(-1)?.updated?.getTime().toString() ?? "0";
    default:
      return (
        question.metadata.optionalFields
          ?.find(({ key }) => key == sortColummn)
          ?.value?.[0]?.toLowerCase() || ""
      );
  }
}

function sortQuestionsFn(columnId: string, answerColumnName: string) {
  return function (a: Question, b: Question) {
    return getSortFuncForColumn(columnId)(
      getSortValue(a, columnId, answerColumnName),
      getSortValue(b, columnId, answerColumnName),
    );
  };
}

function getFilterState(
  formQuery: UseQueryResult<{ id: string }>,
): ColumnFiltersState {
  if (formQuery.isPending || formQuery.error) return [];
  return JSON.parse(
    localStorage.getItem(`filters_${formQuery.data.id}`) || "[]",
  );
}

function getFilterFn(
  filterState: ColumnFiltersState,
  answerColumnName: string,
): (question: Question) => boolean {
  return function (question: Question): boolean {
    const map = new Map<string, boolean>();
    for (let i = 0; i < filterState.length; i++) {
      const filter = filterState[i];
      if (map.get(filter.id)) continue;

      const statusPredicate =
        filter.id == "Status" &&
        ((filter.value == "utfylt" && question.answers.length > 0) ||
          (filter.value == "ikke utfylt" && question.answers.length == 0));

      const answerPredicate =
        filter.id == answerColumnName && filter.value == question.answers.at(-1)?.answer;

      map.set(
        filter.id,
        statusPredicate ||
          answerPredicate ||
          question.metadata.optionalFields?.find(({ key }) => key == filter.id)
            ?.value == filter.value,
      );
    }

    return Array.from(map.values()).every((bool) => bool);
  };
}

import { useForm } from "@/hooks/useForm";
import { useAnswers } from "@/hooks/useAnswers";
import { groupByField } from "@/utils/mapperUtil";
import type { Answer } from "@/api/types";
import { SkeletonLoader } from "@/components/SkeletonLoader";

export function ProgressCircle({
  contextId,
  formId,
}: {
  contextId: string;
  formId: string;
}) {
  const { data: formData, isPending: formIsPending } = useForm(formId);
  const { data: answers, isPending: answerIsPending } = useAnswers(contextId);

  const recordsWithAnswers = formData?.records.map((question) => ({
    ...question,
    answers:
      groupByField<Answer>(answers ?? [], "questionId")[question.id] || [],
  }));

  const numberOfAnswers = recordsWithAnswers?.reduce((count, data) => {
    if (data.answers?.[0]?.answer && data.answers.at(-1)?.answer !== "") {
      count++;
    }
    return count;
  }, 0);

  const percentageAnswered = recordsWithAnswers?.length
    ? Math.round(((numberOfAnswers ?? 0) / recordsWithAnswers.length) * 100)
    : 0;

  const value = isNaN(percentageAnswered) ? 0 : percentageAnswered;
  const size = 70;
  const stroke = 8;
  const normalizedRadius = (size - stroke) / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <SkeletonLoader
      loading={formIsPending || answerIsPending}
      width={`w-[70px]`}
      height={`h-[70px]`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg height={size} width={size} className="transform -rotate-90">
          <circle
            className="stroke-primary/30"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className="stroke-primary"
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference + " " + circumference}
            strokeDashoffset={strokeDashoffset}
            r={normalizedRadius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-bold text-sm">
          {numberOfAnswers}/{recordsWithAnswers?.length}
        </div>
      </div>
    </SkeletonLoader>
  );
}

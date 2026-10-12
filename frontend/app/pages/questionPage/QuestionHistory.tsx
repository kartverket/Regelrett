import { AnswerType, type Answer } from "../../api/types";
import { formatDateTime } from "../../utils/formatTime";
import { useFetchUsername } from "../../hooks/useUser";
import { Circle, Clock, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Props = {
  answers: Answer[];
};

export function QuestionHistory({ answers }: Props) {
  const steps = answers.slice(-3).reverse();

  return (
    <div className="flex flex-col pb-20">
      <div className="flex items-center mb-4">
        <Clock size={22} />
        <span className="font-bold text-lg ml-2">Historikk</span>
      </div>
      {steps.length === 0 ? (
        <p>Ingen historikk finnes</p>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="grid grid-cols-[3rem_1fr_1fr_1fr] w-full">
            <span className="col-start-2 font-medium">NÅR</span>
            <span className="font-medium">SVAR</span>
            <span className="font-medium">HVEM</span>
          </div>

          <div className="flex flex-col w-full min-h-[300px]">
            {steps.map((answer, index) => (
              <QuestionHistoryStep
                key={answer.questionId + answer.answer + index}
                answer={answer}
                opacity={index === 0 ? 1 : 0.6}
                index={index}
                isLast={index === steps.length - 1}
              />
            ))}
          </div>

          <Separator className="mt-10" />
        </div>
      )}
    </div>
  );
}

function QuestionHistoryStep({
  answer,
  opacity,
  index,
  isLast,
}: {
  answer: Answer;
  opacity: number;
  index: number;
  isLast: boolean;
}) {
  const {
    data: username,
    error: usernameError,
    isPending: usernameIsLoading,
  } = useFetchUsername(answer.actor);
  const isCurrent = index === 0;

  function answerString(answer: Answer) {
    let suffix = "";
    if (answer.answerUnit != undefined) {
      suffix = answer.answerUnit;
    } else if (answer.answerType === AnswerType.PERCENT) {
      suffix = "%";
    }

    const answerContent =
      answer.answerType === AnswerType.SELECT_MULTIPLE
        ? answer.answer.split(";").join(",\n")
        : answer.answer;

    return `${answerContent} ${suffix}`;
  }

  return (
    <div className="relative flex w-full mb-20">
      <div className="w-12 flex justify-center items-center relative">
        <div className="relative w-7 h-7 flex ">
          {isCurrent ? (
            <div className="absolute w-7 h-7 rounded-full bg-primary" />
          ) : (
            <Circle className="w-7 h-7 text-gray-300" strokeWidth={2} />
          )}
        </div>

        {!isLast && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[2px] h-[150%] bg-gray-300 z-0" />
        )}
      </div>
      <div className="grid grid-cols-[1fr_1fr_1fr] flex-1 items-center">
        <div>
          <p className="font-bold text-sm">Endret svar</p>
          <p className="text-sm ">{formatDateTime(answer.updated)}</p>
        </div>

        <div className={cn(opacity < 1 && "opacity-60", "text-sm")}>
          <p className="wrap-anywhere">{answerString(answer)}</p>
        </div>

        <div
          className={cn(
            "flex items-center gap-2",
            opacity < 1 && "opacity-60",
            "text-sm",
          )}
        >
          <User />
          <span>
            {usernameIsLoading
              ? "Laster..."
              : usernameError
                ? "Feil ved henting av bruker"
                : username}
          </span>
        </div>
      </div>
    </div>
  );
}

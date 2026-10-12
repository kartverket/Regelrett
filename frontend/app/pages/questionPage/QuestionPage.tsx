import { useNavigate, useParams } from "react-router";
import { useFetchQuestion } from "@/hooks/useFetchQuestion";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { QuestionDetails } from "./QuestionDetails";
import { QuestionAnswer } from "./QuestionAnswer";
import { QuestionComment } from "./QuestionComment";
import { UnsavedChangesModal } from "./UnsavedChangesModal";
import { useState } from "react";
import { QuestionHistory } from "./QuestionHistory";
import { useUser } from "@/hooks/useUser";
import { useContext } from "@/hooks/useContext";
import { useFetchCommentsForQuestion } from "@/hooks/useComments";
import { useFetchAnswersForQuestion } from "@/hooks/useAnswers";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import QuestionNavigation from "./QuestionNavigation";

export default function QuestionPage() {
  const { recordId, contextId } = useParams();

  const contextQuery = useContext(contextId);
  const questionQuery = useFetchQuestion(contextQuery.data?.formId, recordId);
  const answersQuery = useFetchAnswersForQuestion(contextId, recordId);
  const commentsQuery = useFetchCommentsForQuestion(contextId, recordId);
  const userQuery = useUser();

  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const onDiscardOpen = () => setIsDiscardOpen(true);
  const onDiscardClose = () => setIsDiscardOpen(false);

  const [isCommentEditing, setIsCommentEditing] = useState(false);
  const navigate = useNavigate();

  if (
    questionQuery.isPending ||
    answersQuery.isPending ||
    commentsQuery.isPending ||
    userQuery.isPending ||
    contextQuery.isPending
  ) {
    return <LoadingState />;
  }

  if (
    questionQuery.error ||
    answersQuery.error ||
    commentsQuery.error ||
    userQuery.error ||
    contextQuery.error ||
    recordId == undefined ||
    contextId == undefined
  ) {
    return <ErrorState message="Noe gikk galt, prøv gjerne igjen" />;
  }

  const handleBackButton = () => {
    if (isCommentEditing) {
      onDiscardOpen();
    } else {
      navigate("..", { relative: "path" });
    }
  };

  return (
    <div className="flex flex-col mt-8">
      <Button
        variant="link"
        onClick={handleBackButton}
        className="flex justify-start ml-2 text-lg w-max"
      >
        <ArrowLeft className="size-5" />
        Tilbake
      </Button>
      <UnsavedChangesModal
        onOpen={onDiscardOpen}
        onClose={onDiscardClose}
        isOpen={isDiscardOpen}
        onDiscard={() => navigate("..", { relative: "path" })}
      />
      <div className="self-center flex flex-col gap-2 w-full lg:w-1/2 p-10 lg:p-0">
        <QuestionNavigation
          formId={contextQuery.data.formId}
          recordId={recordId}
          contextId={contextId}
        />
        <QuestionDetails
          question={questionQuery.data}
          answerUpdated={answersQuery.data.at(-1)?.updated}
          formId={contextQuery.data.formId}
        />
        <Separator className="my-10" />
        <QuestionAnswer
          question={questionQuery.data}
          answers={answersQuery.data}
          contextId={contextId}
          user={userQuery.data.user}
          choices={questionQuery.data.metadata.answerMetadata.options}
          answerExpiry={questionQuery.data.metadata.answerMetadata.expiry}
        />
        <Separator className="my-10" />
        <QuestionComment
          question={questionQuery.data}
          latestComment={commentsQuery.data.at(-1)?.comment ?? ""}
          contextId={contextId}
          isEditing={isCommentEditing}
          setIsEditing={setIsCommentEditing}
          user={userQuery.data.user}
        />
        <Separator className="my-10" />
        <QuestionHistory answers={answersQuery.data} />
      </div>
    </div>
  );
}

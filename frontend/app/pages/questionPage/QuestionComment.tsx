import type { KeyboardEvent} from "react";
import { useEffect, useRef, useState } from "react";
import { DeleteCommentModal } from "../../components/DeleteCommentModal";
import type { Question, User } from "../../api/types";
import { useSubmitComment } from "../../hooks/useComments";
import { Button } from "@/components/ui/button";
import { Check, Edit, Plus, Trash2, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/Spinner";

type Props = {
  question: Question;
  latestComment: string;
  contextId: string;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  user: User;
};

export function QuestionComment({
  question,
  latestComment,
  contextId,
  isEditing,
  setIsEditing,
  user,
}: Props) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [editedComment, setEditedComment] = useState<string | null>(null);

  const { mutate: submitComment, isPending: isLoading } = useSubmitComment(
    contextId,
    question.recordId,
    setIsEditing,
  );

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const onDeleteOpen = () => setIsDeleteOpen(true);
  const onDeleteClose = () => setIsDeleteOpen(false);

  const handleCommentSubmit = () => {
    if (editedComment !== latestComment && editedComment != null) {
      submitComment({
        actor: user.id,
        recordId: question.recordId,
        questionId: question.id,
        comment: editedComment ?? latestComment,
        contextId: contextId,
      });
    }
  };

  const handleDiscardChanges = () => {
    setEditedComment(latestComment);
    setIsEditing(false);
  };

  // set focus to text area when creating or editing comment
  useEffect(() => {
    if (isEditing && textAreaRef.current) {
      const textArea = textAreaRef.current;
      textArea.focus();
      textArea.setSelectionRange(textArea.value.length, textArea.value.length);
    }
  }, [isEditing]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (textAreaRef.current !== document.activeElement) return;

    if (event.key === "Escape") {
      handleDiscardChanges();
    }
  };

  return (
    <div className="flex flex-col">
      <p className="font-bold text-lg pb-4">Kommentar</p>
      {isEditing ? (
        <div className="gap-4 flex-col">
          <Textarea
            ref={textAreaRef}
            defaultValue={editedComment ?? latestComment}
            onChange={(e) => setEditedComment(e.target.value)}
            onKeyDown={(ev) => {
              handleKeyDown(ev);
            }}
            className="bg-white mb-4"
          />
          <div className="flex flex-row gap-4">
            <Button
              aria-label="Lagre kommentar"
              variant="outline"
              onClick={handleCommentSubmit}
              disabled={editedComment === latestComment || isLoading}
            >
              {isLoading && <Spinner />}
              {!isLoading && <Check className="size-5" />}
              Lagre
            </Button>
            <Button
              aria-label="Slett kommentar"
              variant="outlineDestructive"
              onClick={handleDiscardChanges}
            >
              <X className=" size-5" />
              Avbryt
            </Button>
          </div>
        </div>
      ) : latestComment === "" ? (
        <Button
          aria-label="Legg til kommentar"
          variant="outline"
          onClick={() => setIsEditing(true)}
          className="w-fit"
        >
          <Plus className="size-5" />
          Ny kommentar
        </Button>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            <p className="max-w-[328px] overflow-hidden whitespace-pre-wrap ">
              {latestComment}
            </p>
            <div className="flex gap-6">
              <Button
                aria-label="Rediger kommentar"
                variant="outline"
                onClick={() => {
                  setEditedComment(latestComment);
                  setIsEditing(true);
                }}
                className="flex justify-start"
              >
                <Edit className="size-5 " />
                Rediger
              </Button>
              <Button
                aria-label="Slett kommentar"
                variant="outlineDestructive"
                onClick={onDeleteOpen}
                className="flex justify-start"
              >
                <Trash2 className="size-5" />
                Slett
              </Button>
            </div>
          </div>
          <DeleteCommentModal
            onOpen={onDeleteOpen}
            onClose={onDeleteClose}
            isOpen={isDeleteOpen}
            recordId={question.recordId}
            contextId={contextId}
          />
        </>
      )}
    </div>
  );
}

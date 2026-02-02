import type { KeyboardEvent} from "react";
import { useEffect, useRef, useState } from "react";
import { DeleteCommentModal } from "../../../components/DeleteCommentModal";
import { LastUpdated } from "../../../components/LastUpdated";
import { useCommentState } from "./TableState";
import type { User } from "../../../api/types";
import { useSubmitComment } from "../../../hooks/useComments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/Spinner";
import { Edit, Trash2, MessageSquarePlus, Check, X } from "lucide-react";
import { useContextPermissions } from "@/hooks/useContext";

// Replace with type from api when the internal data model is implemented
type Props = {
  comment: string;
  recordId: string;
  questionId: string;
  updated?: Date;
  contextId: string;
  user: User;
};

export function Comment({
  comment,
  recordId,
  questionId,
  updated,
  contextId,
  user,
}: Props) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const {
    setEditedComment,
    setIsEditing,
    editedComment,
    isEditMode,
    setRowState,
  } = useCommentState(questionId);
  const [commentDeleted] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { mutate: submitComment, isPending: isLoading } = useSubmitComment(
    contextId,
    undefined,
    setIsEditing,
  );

  const {
    data: permissions,
    isPending: permissionsIsPending,
  } = useContextPermissions(contextId);

  const handleDiscardChanges = () => {
    setRowState(questionId, {
      comment: { isEditMode: false, editedComment: comment },
    });
  };

  // set focus to text area when creating or editing comment
  useEffect(() => {
    if (isEditMode && textAreaRef.current) {
      const textArea = textAreaRef.current;
      textArea.focus();
      textArea.setSelectionRange(textArea.value.length, textArea.value.length);
    }
  }, [isEditMode]);

  if (permissionsIsPending) {
    return <Spinner></Spinner>;
  }
  if (!permissions) {
    return;
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (textAreaRef.current !== document.activeElement) return;

    if (event.key === "Escape") {
      handleDiscardChanges();
    }
  };

  if (isEditMode) {
    return (
      <div className="flex flex-col w-min-[200px] gap-2">
        <Textarea
          ref={textAreaRef}
          defaultValue={editedComment ?? comment}
          onChange={(e) => setEditedComment(e.target.value)}
          className="h-[88px]"
          onKeyDown={(ev) => {
            handleKeyDown(ev);
          }}
          disabled={!permissions.canWrite}
        />
        <div className="flex gap-2">
          <Button
            aria-label="Lagre kommentar"
            variant="outline"
            size="sm"
            onClick={() => {
              if (editedComment !== comment && editedComment != null) {
                submitComment({
                  actor: user.id,
                  recordId: recordId,
                  questionId: questionId,
                  comment: editedComment ?? comment,
                  contextId: contextId ?? null,
                });
              }
            }}
            disabled={editedComment === comment || isLoading || !permissions.canWrite}
            className="bg-transparent has-[>svg]:px-2"
          >
            {isLoading ? <Spinner /> : <Check className="size-5" />}
          </Button>
          <Button
            aria-label="Slett kommentar"
            variant="outlineDestructive"
            size="sm"
            onClick={() => {
              handleDiscardChanges();
            }}
            disabled={isLoading || !permissions.canWrite}
            className="bg-transparent has-[>svg]:px-2"
          >
            <X className="size-5" />
          </Button>
        </div>
      </div>
    );
  }

  // change this when the new data model is implemented. Because this should not be an empty string
  if (comment === "" || commentDeleted) {
    return (
      <Button
        aria-label="Legg til kommentar"
        variant="outline"
        onClick={() => {
          setRowState(questionId, {
            comment: { editedComment: comment, isEditMode: true },
          });
        }}
        className={`${updated ? "mb-0" : "mb-10"} bg-transparent has-[>svg]:px-2`}
        size="sm"
        disabled={!permissions.canWrite}
      >
        <MessageSquarePlus className="size-5" />
      </Button>
    );
  }
  return (
    <>
      <div
        className={`min-w-[200px] flex flex-col gap-2 ${updated ? "mb-0" : "mb-6"}`}
      >
        <p className="max-w-[328px] overflow-hidden whitespace-pre-wrap text-sm">
          {comment}
        </p>
        <div className="flex flex-row gap-2 pb-1">
          <Button
            aria-label="Rediger kommentar"
            variant="outline"
            size="sm"
            onClick={() => {
              setRowState(questionId, {
                comment: { editedComment: comment, isEditMode: true },
              });
            }}
            className="flex justify-start bg-transparent"
            disabled={!permissions.canWrite}
          >
            <Edit className="size-5 " />
          </Button>
          <Button
            aria-label="Slett kommentar"
            variant="outlineDestructive"
            size="sm"
            onClick={() => {
              setIsDeleteOpen(true);
            }}
            className="flex justify-start bg-transparent"
            disabled={!permissions.canWrite}
          >
            <Trash2 className="size-5" />
          </Button>
        </div>
      </div>
      <LastUpdated updated={updated} isComment />
      <DeleteCommentModal
        onOpen={() => setIsDeleteOpen(true)}
        onClose={() => setIsDeleteOpen(false)}
        isOpen={isDeleteOpen}
        recordId={recordId}
        contextId={contextId}
      />
    </>
  );
}

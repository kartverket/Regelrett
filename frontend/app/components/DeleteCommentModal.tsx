import { useDeleteComment } from "../hooks/useComments";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type Props = {
  onOpen: () => void;
  onClose: () => void;
  isOpen: boolean;
  recordId: string;
  contextId: string;
};
export function DeleteCommentModal({
  onClose,
  isOpen,
  recordId,
  contextId,
}: Props) {
  const { mutate: deleteComment, isPending: isLoading } = useDeleteComment(
    contextId,
    recordId,
    onClose,
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Slett kommentar</DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-base">
          Er du sikker på at du vil slette kommentaren?
        </DialogDescription>

        <DialogFooter className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteComment()}
            disabled={isLoading}
          >
            {isLoading ? (
              "Sletter..."
            ) : (
              <>
                <Trash2 className="size-5" />
                Slett kommentar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

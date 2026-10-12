import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  onOpen: () => void;
  onClose: () => void;
  isOpen: boolean;
  onDiscard: () => void;
};

export function UnsavedChangesModal({ onClose, isOpen, onDiscard }: Props) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Forkast endringer?</DialogTitle>
          <DialogDescription className="text-sm mt-2">
            Du er i ferd med å navigere deg vekk fra siden. Hvis du fortsetter
            vil endringene du har gjort bli forkastet. Vil du fortsette?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex justify-end gap-2 pt-4">
          <Button variant="outlineDestructive" onClick={onDiscard}>
            Forkast
          </Button>
          <Button onClick={onClose}>Avbryt</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

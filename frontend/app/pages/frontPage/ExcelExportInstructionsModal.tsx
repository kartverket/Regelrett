import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SkeletonLoader } from "../../components/SkeletonLoader";

type Props = {
  onClose: () => void;
  isOpen: boolean;
};
export function ExcelExportInstructionsModal({ onClose, isOpen }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Eksportere til Excel</DialogTitle>
        </DialogHeader>
        <SkeletonLoader loading={false}>
          <DialogDescription className="text-base break-words max-w-sm">
            <ol className="flex flex-col list-decimal pl-5 gap-6">
              <li>
                <p className="pb-2">Lag et tomt nytt regneark</p>
                <p>
                  Klikk <i>Tom arbeidsbok</i> fra forsiden eller klikk Fil, så
                  Ny
                </p>
              </li>
              <li>
                <p className="pb-2">Importer CSV filen</p>
                <p>
                  Klikk Data, Hent data (Power Query) og velg filen fra disk
                </p>
              </li>
              <li>
                <p className="pb-2">Sørg for riktige innstillinger</p>
                <p>
                  Filopprinnelse skal være 65001: Unicode (UTF-8) og skilletegn
                  komma
                </p>
              </li>
            </ol>
          </DialogDescription>
        </SkeletonLoader>

        <DialogFooter className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Lukk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

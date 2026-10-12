import { useSearchParams } from "react-router";
import { useFetchAllContexts } from "../../hooks/useContext";
import { useMemo } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function CopyContextDropdown({
  setCopyContext,
  copyComments,
  setCopyComments,
}: {
  setCopyContext: (context: string) => void;
  copyComments: "yes" | "no" | null;
  setCopyComments: (val: "yes" | "no") => void;
}) {
  const [searchParams] = useSearchParams();
  const formId = searchParams.get("formId");
  const copyContext = searchParams.get("copyContext");

  const { data: contexts } = useFetchAllContexts();

  const contextsCollection = useMemo(() => {
    return contexts?.filter((context) => context.formId == formId) ?? [];
  }, [contexts, formId]);

  const isDisabled = contextsCollection.length === 0;

  return (
    <>
      <Label className="font-bold mb-2">
        Kopier svar fra eksisterende skjema
      </Label>
      <Select
        disabled={isDisabled}
        onValueChange={(value) => setCopyContext(value)}
        value={copyContext ?? ""}
      >
        <SelectTrigger className="bg-card w-90">
          <SelectValue
            placeholder={
              isDisabled ? "Ingen eksisterende skjema funnet" : "Velg skjema"
            }
          />
        </SelectTrigger>
        <SelectContent>
          {contextsCollection.map((context) => (
            <SelectItem key={context.id} value={context.id}>
              {context.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {copyContext !== "undefined" && copyContext !== null && (
        <div className="flex flex-col ">
          <Label className="font-bold mb-2">
            Vil du også kopiere kommentarene?
          </Label>
          <RadioGroup
            value={copyComments ?? undefined}
            onValueChange={(value) => setCopyComments(value as "yes" | "no")}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="yes" />
              <Label htmlFor="yes">Ja</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="no" />
              <Label htmlFor="no">Nei</Label>
            </div>
          </RadioGroup>
        </div>
      )}
    </>
  );
}

import { useStoredRedirect } from "../../hooks/useStoredRedirect";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function RedirectBackButton() {
  const storedRedirect = useStoredRedirect();

  if (!storedRedirect) return null;

  return (
    <div className="flex flex-col py-2 align-baseline justify-start sticky top-0 ">
      <Button
        variant="link"
        onClick={() => {
          window.location.href = storedRedirect.url;
        }}
        className="flex justify-start text-base w-fit "
      >
        <ArrowLeft className="size-5" />
        Tilbake til {storedRedirect?.title}
      </Button>
    </div>
  );
}

import { useNavigate, useSearchParams } from "react-router";
import { useForms } from "../../hooks/useForms";
import type { FormEvent} from "react";
import React, { useState } from "react";
import { useSubmitContext } from "../../hooks/useContext";
import RedirectBackButton from "../../components/buttons/RedirectBackButton";
import { CopyContextDropdown } from "./CopyContextDropdown";
import { useUser } from "../../hooks/useUser";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/Spinner";

export default function CreateContextPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const teamId = searchParams.get("teamId");
  const name = searchParams.get("name");
  const formId = searchParams.get("formId");
  const redirect = searchParams.get("redirect");

  const copyContext = searchParams.get("copyContext");
  const [copyComments, setCopyComments] = useState<"yes" | "no" | null>(null);

  const { mutate: submitContext, isPending: isLoading } = useSubmitContext();

  const {
    data: formData,
    error: formError,
    isPending: formIsPending,
  } = useForms();

  const {
    data: userData,
    isPending: isUserLoading,
    isError: isUserError,
  } = useUser();

  if (formError || isUserError) {
    return (
      <>
        <RedirectBackButton />
        <ErrorState message="Noe gikk galt, prøv gjerne igjen" />
      </>
    );
  }

  const isButtonDisabled =
    !teamId ||
    !formId ||
    !name ||
    isLoading ||
    (copyContext !== null &&
      copyContext !== "undefined" &&
      copyComments === null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (teamId && name && formId) {
      submitContext(
        { teamId, formId: formId, name, copyContext, copyComments },
        {
          onSuccess: (data) => {
            if (redirect) {
              const incomingRedirect = decodeURIComponent(redirect)
                .replace("{contextId}", data.data.id)
                .replace("{tableId}", formId) // Dette er til FRISK tror jeg - vent med å oppdatere?
                .replace("{contextName}", data.data.name)
                .replace(
                  "{tableName}",
                  formData?.find((form) => form.id === data.data.formId)
                    ?.name ?? formId,
                );
              const fullRedirect = new URL(incomingRedirect);
              const newRedirect = new URL(
                `${window.location.origin}/context/${data.data.id}`,
              );
              fullRedirect.searchParams.set(
                "redirect",
                `${newRedirect.toString()}`,
              );
              window.location.href = fullRedirect.toString();
            } else {
              navigate(`/context/${data.data.id}`);
            }
          },
        },
      );
    } else {
      console.error("teamId, formId, and contextName must be provided");
    }
  };

  return (
    <>
      <RedirectBackButton />
      <div className="flex flex-col items-center justify-center mt-32">
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-8">Opprett sikkerhetsskjema</h1>
          <div className="space-y-5">
            <div>
              <Label htmlFor="teamSelect" className="font-bold mb-2">
                Velg team
              </Label>
              <Select
                required
                value={teamId ?? ""}
                onValueChange={(value) =>
                  setSearchParams(
                    (current) => {
                      current.set("teamId", value);
                      return current;
                    },
                    { replace: true },
                  )
                }
                disabled={isUserLoading}
              >
                <SelectTrigger className="w-90 bg-card">
                  <SelectValue placeholder="Velg team" />
                  {isUserLoading && <Spinner />}
                </SelectTrigger>
                <SelectContent>
                  {userData?.groups?.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="formSelect" className="font-bold mb-2">
                Velg sikkerhetsskjema
              </Label>
              <Select
                required
                value={formId ?? ""}
                onValueChange={(value) =>
                  setSearchParams(
                    (current) => {
                      current.set("formId", value);
                      return current;
                    },
                    { replace: true },
                  )
                }
                disabled={formIsPending}
              >
                <SelectTrigger className="w-90 bg-card">
                  <SelectValue placeholder="Velg skjema" />
                  {formIsPending && <Spinner />}
                </SelectTrigger>
                <SelectContent>
                  {formData?.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formId && formId.trim() && teamId && teamId.trim() && (
              <CopyContextDropdown
                setCopyContext={(newContext) =>
                  setSearchParams(
                    (current) => {
                      current.set("copyContext", newContext);
                      return current;
                    },
                    { replace: true },
                  )
                }
                copyComments={copyComments}
                setCopyComments={setCopyComments}
              />
            )}

            <div>
              <Label htmlFor="contextName" className="font-bold mb-2">
                Navn på skjemautfylling
              </Label>
              <Input
                id="contextName"
                type="text"
                placeholder="Skriv inn navn på skjemautfylling"
                value={searchParams.get("name") ?? ""}
                onChange={(e) =>
                  setSearchParams(
                    (current) => {
                      current.set("name", e.target.value);
                      return current;
                    },
                    { replace: true },
                  )
                }
                required
                className="bg-card w-90"
              />
            </div>

            <Button type="submit" disabled={isButtonDisabled} className="w-40">
              {isLoading ? <Spinner /> : "Opprett skjema"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

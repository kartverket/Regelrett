import { Input } from "@/components/ui/input";
import type { Dispatch, SetStateAction } from "react";
import React from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  useChangeNameForContext,
  useContext,
} from "@/hooks/useContext";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { ErrorState } from "@/components/ErrorState";
import { useParams } from "react-router";
import { isAxiosError } from "axios";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";

const contextNameFormSchema = z.object({
  newName: z.string().min(1, { message: "Du må skrive inn et navn." }),
});

type ChangeContextNameTabProps = {
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export function ChangeContextNameTab({ setOpen }: ChangeContextNameTabProps) {
  const { contextId } = useParams<{ contextId: string }>();
  const {
    data: context,
    error: contextError,
    isPending: contextIsPending,
  } = useContext(contextId);

  const nameSubmitMutation = useChangeNameForContext({
    contextId: contextId ?? "",
  });

  const contextNameForm = useForm<z.infer<typeof contextNameFormSchema>>({
    resolver: zodResolver(contextNameFormSchema),
    defaultValues: { newName: "" },
  });

  function onSubmit(value: z.infer<typeof contextNameFormSchema>) {
    nameSubmitMutation.mutate(value.newName, {
      onSuccess: () => {
        setOpen(false);
        toast.success("Endringen er lagret!", {
          description: `Skjemaet har byttet navn fra ${context?.name} til ${value.newName}.`,
          duration: 5000,
          id: "change-context-name-success",
        });
      },
      onError: (error) => {
        if (isAxiosError(error) && error.response?.status === 409) {
          contextNameForm.setError("newName", {
            type: "manual",
            message:
              "Et skjema med dette navnet eksisterer allerede, velg et unikt navn",
          });
        } else {
          contextNameForm.setError("newName", {
            type: "manual",
            message: "Noe gikk galt. Prøv igjen senere.",
          });
        }
      },
    });
  }

  return (
    <Card>
      <Form {...contextNameForm}>
        <form
          onSubmit={contextNameForm.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          <CardContent className="space-y-2">
            <h4 className="text-sm font-bold">Skjemautfyllingen heter:</h4>
            <SkeletonLoader loading={contextIsPending}>
              {contextError ? (
                <ErrorState
                  message={"Klarte ikke hente navnet til skjemautfyllingen"}
                />
              ) : (
                <p className="mb-4">{context?.name}</p>
              )}
            </SkeletonLoader>

            <FormField
              control={contextNameForm.control}
              name="newName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Skriv inn det nye navnet for skjemautfyllingen:
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Skjemautfyllingsnavn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="reset"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Avbryt
            </Button>
            <Button type="submit">Lagre</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

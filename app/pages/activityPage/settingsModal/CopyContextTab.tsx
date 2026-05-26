import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Dispatch, SetStateAction } from "react";
import React from "react";
import {
  useContext,
  useCopyContextAnswers,
  useCopyContextComments,
  useFetchAllContexts,
} from "@/hooks/useContext";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Spinner } from "@/components/Spinner";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const CopyFormSchema = z.object({
  context: z.string({
    error: "Du må velge et eksisterende skjema.",
  }),
  comments: z.enum(["yes", "no"] as const, {
    error: "Du må velge om du vil kopiere kommentarer eller ikke.",
  }),
});

type CopyContextTabProps = {
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export function CopyContextTab({ setOpen }: CopyContextTabProps) {
  const searchParams = useParams();
  const queryClient = useQueryClient();

  const contextId = searchParams.contextId;

  const {
    mutateAsync: mutateCopyComments,
    isPending: pendingCopyComments,
    status: statusCopyComments,
  } = useCopyContextComments({
    contextId,
    onError: onCopyMutationError,
  });

  const {
    mutate: mutateCopyAnswers,
    isPending: pendingCopyAnswers,
    isSuccess: isSuccessCopyAnswers,
  } = useCopyContextAnswers({
    contextId,
    onError: onCopyMutationError,
  });

  async function onCopyMutationSuccess(copyContextName: string) {
    setOpen(false);
    await queryClient.invalidateQueries();
    const toastId = "copy-context-success";
    toast.success("Svar kopiert!", {
      description: `Skjemaet inneholder nå samme svar som ${copyContextName}`,
      duration: 5000,
      id: toastId,
    });
  }

  function onCopyMutationError() {
    const toastId = "copy-context-error";
    toast.error("Kunne ikke kopiere svar", {
      description:
        "Svarene ble ikke kopiert. Kontroller tilgangen din og prøv på nytt.",
      duration: 5000,
      id: toastId,
    });
  }

  const { data: currentContext } = useContext(contextId);

  const { data: contexts, isPending: contextsIsLoading } =
    useFetchAllContexts();

  const copyForm = useForm<z.infer<typeof CopyFormSchema>>({
    resolver: zodResolver(CopyFormSchema),
  });
  function onSubmit(value: z.infer<typeof CopyFormSchema>) {
    const copyContextName = contexts?.find((context) => {
      return context.id === value.context;
    })?.name;

    mutateCopyAnswers(
      { copyContextId: value.context },
      {
        onSuccess: () => {
          if (statusCopyComments == "success" || statusCopyComments == "idle") {
            onCopyMutationSuccess(copyContextName ?? "");
          }
        },
      },
    );
    if (value.comments === "yes") {
      mutateCopyComments(
        { copyContextId: value.context },
        {
          onSuccess: () => {
            if (isSuccessCopyAnswers) {
              onCopyMutationSuccess(copyContextName ?? "");
            }
          },
        },
      );
    }
  }

  const isDisabled =
    contexts?.filter(
      (context) =>
        context.formId === currentContext?.formId &&
        context.id !== currentContext?.id,
    ).length === 0 ||
    pendingCopyAnswers ||
    pendingCopyComments;

  return (
    <Card>
      <Form {...copyForm}>
        <form onSubmit={copyForm.handleSubmit(onSubmit)} className="space-y-8">
          <CardContent className="space-y-2">
            <FormField
              control={copyForm.control}
              name="context"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kopier svar fra eksisterende skjema:</FormLabel>

                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isDisabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isDisabled
                              ? "Ingen eksisterende skjema funnet"
                              : "Velg skjema"
                          }
                        />
                        {contextsIsLoading && (
                          <Spinner className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {contexts
                        ?.filter(
                          (context) =>
                            context.formId === currentContext?.formId &&
                            context.id !== currentContext?.id,
                        )
                        .map((context) => (
                          <SelectItem key={context.id} value={context.id}>
                            {context.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={copyForm.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vil du også kopiere kommentarene?</FormLabel>

                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="yes" />
                        </FormControl>

                        <FormLabel htmlFor="r1">Ja</FormLabel>
                      </FormItem>

                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="no" />
                        </FormControl>

                        <FormLabel htmlFor="r2">Nei</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-end space-x-2 pt-4">
            <Button
              type="reset"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={isDisabled}>
              {" "}
              {pendingCopyAnswers || pendingCopyComments ? (
                <Spinner />
              ) : (
                "Kopier"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

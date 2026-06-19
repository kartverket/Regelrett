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
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { ErrorState } from "@/components/ErrorState";
import { useParams } from "react-router";
import { isAxiosError } from "axios";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  useFetchUsername,
  useSearchUser,
  useUser,
} from "@/hooks/useUser";
import { useShares } from "@/hooks/useShares";
import { useContext } from "@/hooks/useContext";
import { formatDate } from "@/utils/formatTime";
import { useDebounce } from "@/hooks/useDebounce";
import { Search } from "lucide-react";


const shareFormSchema = z.object({
  userId: z.string().min(1, { message: "Du må velge en bruker." }),
  expiresAt: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;
        return new Date(value).getTime() > Date.now();
      },
      { message: "Utløpstid må være frem i tid." },
    ),
});

type ShareAccessTabProps = {
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export function ShareAccessTab({ setOpen }: ShareAccessTabProps) {
  const { contextId } = useParams<{ contextId: string }>();
  const {
    data: context,
    error: contextError,
    isPending: contextIsPending,
  } = useContext(contextId);

  const {
    data: userinfo,
    error: userinfoError,
    isPending: userinfoIsPending,
  } = useUser();

  const { shares, shareContext } = useShares(contextId ?? "");
  const shareList = shares.data ?? [];

  const ownerTeamName = userinfo?.groups.find(
    (team) => team.id === context?.teamId,
  )?.displayName;

  const shareForm = useForm<z.infer<typeof shareFormSchema>>({
    resolver: zodResolver(shareFormSchema),
    defaultValues: { userId: "", expiresAt: "" },
  });

  const [usernameInput, setUsernameInput] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const hasSelectedUser = shareForm.watch("userId");
  const debouncedUsernameInput = useDebounce(usernameInput, 500);
  const isDebouncing = usernameInput !== debouncedUsernameInput;
  const { data: userSuggestions = [], isFetching: isSearching } = useSearchUser(
    hasSelectedUser ? "" : debouncedUsernameInput,
  );

  function onSubmit(value: z.infer<typeof shareFormSchema>) {
    if (!userinfo?.user.id) return;

    shareContext.mutate(
      {
        userId: value.userId,
        expiresAt: value.expiresAt
          ? new Date(`${value.expiresAt}T00:00:00.000Z`).toISOString()
          : undefined,
        sharedBy: userinfo?.user.id,
      },
      {
        onSuccess: () => {
          shareForm.reset();
          setUsernameInput("");
          setShowSuggestions(false);
        },
        onError: (error) => {
          if (isAxiosError(error) && error.response?.status === 409) {
            shareForm.setError("userId", {
              type: "manual",
              message: "Brukeren har allerede tilgang til dette skjemaet.",
            });
          } else {
            shareForm.setError("userId", {
              type: "manual",
              message: "Noe gikk galt. Prøv igjen senere.",
            });
          }
        },
      },
    );
  }

  const showUserResults =
    showSuggestions && !hasSelectedUser && usernameInput.length >= 1;

  return (
    <Card>
      <Form {...shareForm}>
        <form onSubmit={shareForm.handleSubmit(onSubmit)} className="space-y-4">
          <CardContent className="space-y-4 pt-4">
            <SkeletonLoader
              loading={
                contextIsPending || userinfoIsPending || shares.isLoading
              }
              width="w-full"
            >
              {contextError || userinfoError ? (
                <ErrorState message="Klarte ikke hente tilganger" />
              ) : (
                <section aria-label="Nåværende tilganger" className="space-y-2">
                  <h4 className="text-sm font-semibold">Hvem har tilgang</h4>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Eier (skrivetilgang)
                    </span>
                    <span className="font-medium">{ownerTeamName}</span>
                  </div>

                  {shareList.length > 0 && (
                    <>
                      <Separator />
                      <p className="text-sm text-muted-foreground">
                        Lesetilgang
                      </p>
                      <ul className="space-y-1">
                        {shareList.map((share) => (
                          <li key={share.userId} className="text-sm">
                            <div className="flex flex-col">
                              <UsernameDisplay userId={share.userId} />
                              {share.expiresAt && (
                                <span className="text-xs text-muted-foreground">
                                  Utløper {formatDate(share.expiresAt)}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </section>
              )}
            </SkeletonLoader>

            <Separator />

            <FormField
              control={shareForm.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gi lesetilgang til bruker</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type={"search"}
                        placeholder="Søk etter bruker"
                        value={usernameInput}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setShowSuggestions(false)}
                        onChange={(event) => {
                          const value = event.target.value;
                          setUsernameInput(value);
                          field.onChange("");
                          setShowSuggestions(true);
                        }}
                        className="pl-10"
                      />

                      {showUserResults && (
                        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-background p-1 shadow-md">
                          {isDebouncing || isSearching ? (
                            <div className="px-2 py-1 text-sm text-muted-foreground">
                              Søker...
                            </div>
                          ) : userSuggestions.length === 0 ? (
                            <div className="px-2 py-1 text-sm text-muted-foreground">
                              Ingen treff
                            </div>
                          ) : (
                            userSuggestions.map((user) => (
                              <Button
                                key={user.id}
                                type="button"
                                variant="ghost"
                                className="w-full justify-start rounded px-2 py-1 text-left text-sm"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  shareForm.setValue("userId", user.id, {
                                    shouldValidate: true,
                                  });
                                  setUsernameInput(user.displayName);
                                  setShowSuggestions(false);
                                }}
                              >
                                <span className="font-medium">
                                  {user.displayName}
                                </span>
                              </Button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={shareForm.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tidsbegrenset tilgang (valgfritt)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
            <Button
              type="submit"
              disabled={shareContext.isPending || userinfoIsPending}
            >
              Gi tilgang
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function UsernameDisplay({ userId }: { userId: string }) {
  const {
    data: username,
    error: usernameError,
    isPending: usernameIsLoading,
  } = useFetchUsername(userId);

  if (usernameIsLoading) return <span className="text-muted-foreground">Laster...</span>;
  if (usernameError) return <span className="text-destructive">Feil ved henting av bruker</span>;
  return <span>{username}</span>;
}

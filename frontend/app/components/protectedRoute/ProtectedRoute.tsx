import { Link, Outlet } from "react-router";
import { Separator } from "@/components/ui/separator";
import RRLogo from "@/assets/regelrettlogo.svg";
import { Button } from "../ui/button";
import { LogOut, User } from "lucide-react";
import { useUser } from "@/hooks/useUser";

export default function ProtectedRoute() {
  const { data, isSuccess } = useUser();

  return (
    <div className="bg-background pb-8 min-h-screen">
      <div className="bg-secondary flex flex-row justify-between">
        <header className="flex items-center  px-4 py-3 ">
          <Link className="ml-2 cursor-pointer font-bold text-lg" to={"/"}>
            <img src={RRLogo} alt="Regelrett logo" />
          </Link>
        </header>
        <div className="flex flex-row gap-2 items-center justify-end ">
          {isSuccess && (
            <div className="flex flex-row gap-2 items-center ">
              <User />
              <p>{data.user.displayName}</p>
            </div>
          )}
          <Button variant="ghost" asChild>
            <a href="/logout">
              <LogOut className="size-5" />
              Logg ut
            </a>
          </Button>
        </div>
      </div>
      <Separator className="border-1" />
      <Outlet />
    </div>
  );
}

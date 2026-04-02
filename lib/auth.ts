import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isEmailAllowedInProduction } from "@/lib/access-control";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const user = session?.user;

  if (!user?.id || !user.email || !user.name) {
    return null;
  }
  if (!isEmailAllowedInProduction(user.email)) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

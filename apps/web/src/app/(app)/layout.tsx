import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/");
  return <div className="flex h-dvh flex-col">{children}</div>;
}

import { redirect } from "next/navigation";
import { getUserTeams } from "@/app/actions/chat";
import { getSessionUserId } from "@/lib/auth/session";
import CreateWorkspace from "@/components/CreateWorkspace";

interface PageProps {
  searchParams: Promise<{ new?: string }>;
}

export default async function TeamsPage({ searchParams }: PageProps) {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/signIn");
  }

  const resolvedSearchParams = await searchParams;
  const isCreatingNew = resolvedSearchParams.new === "true";

  // Retrieve user's teams
  const teams = await getUserTeams();

  // Only redirect if they already belong to a workspace AND did not request to create a new one
  if (teams.length > 0 && !isCreatingNew) {
    redirect(`/teams/${teams[0].id}/collab`);
  }

  return (
    <section className="flex min-h-[calc(100vh-56px)] md:min-h-screen items-center justify-center bg-zinc-50/50 px-4 py-12">
      <CreateWorkspace />
    </section>
  );
}
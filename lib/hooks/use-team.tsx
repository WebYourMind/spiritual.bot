import { Team, TeamForm } from "lib/types";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export function useTeam() {
  const { data: session } = useSession() as any;
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState(null);

  async function fetchTeam() {
    setIsLoading(true);
    setLoadingMessage("Getting team info...");
    try {
      const response = await fetch(`/api/team/?userId=${session?.user.id}`);
      if (!response.ok && response.status !== 404) {
        throw new Error("Failed to fetch team.");
      }
      const data = (await response.json()) as any;
      setTeam(data.team);
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error getting team: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function createTeam(teamData: TeamForm) {
    setIsLoading(true);
    setLoadingMessage(`Creating ${teamData.name}...`);
    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team: teamData, userId: session.user.id }),
      });
      if (!response.ok) {
        throw new Error("Failed to create team.");
      }
      const data = (await response.json()) as any;
      setTeam(data.team);
      toast.success("Team created successfully.");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateTeam(updatedTeam: Team) {
    setIsLoading(true);
    setLoadingMessage(`Updating team info...`);
    try {
      const response = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team: updatedTeam, adminId: session.user.id }),
      });
      if (!response.ok) {
        throw new Error("Failed to update team info.");
      }
      setTeam(updatedTeam);
      toast.success("Team updated successfully.");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      if (!team) {
        fetchTeam();
      } else {
        setIsLoading(false);
      }
    }
  }, [session?.user.id]);

  return { team, isLoading, error, fetchTeam, createTeam, loadingMessage, updateTeam, setTeam };
}

"use client";

import InputField from "app/(core)/(auth)/components/input-field";
import Card from "components/card";
import { Button } from "components/ui/button";
import { IconCheck, IconClose, IconPlus } from "components/ui/icons";
import { Label } from "components/ui/label";
import { useCopyToClipboard } from "lib/hooks/use-copy-to-clipboard";
import { ApiResponse, Team } from "lib/types";
import { isValidEmail } from "lib/utils";
import { useState } from "react";
import toast from "react-hot-toast";

const defaultInvite =
  "I'm thrilled to invite you to join our team on the IBIS AI platform, a dynamic tool that's transforming how we collaborate and grow. Discover your unique thinking style, understand our team's diverse perspectives, and engage in more effective collaboration. It's quick to set up and offers valuable insights for both personal development and team dynamics.";

type InviteLinkProps = {
  team: Team;
  inviterName?: string | null;
};

const DividerWithText = () => {
  return (
    <div className="my-4 flex items-center justify-center">
      <div className="mr-3 flex-grow border-t"></div>
      <span className="text-muted">or</span>
      <div className="ml-3 flex-grow border-t"></div>
    </div>
  );
};

export default function InviteLink({ team, inviterName }: InviteLinkProps) {
  const baseURL = window.location.origin;
  const inviteUrl = `${baseURL}/accept-invite/?token=${team.inviteToken}`;

  const [invitees, setInvitees] = useState([{ email: "", name: "" }]);
  const [inviteButtonText, setInviteButtonText] = useState("Invite");
  const [inviteMessage, setInviteMessage] = useState(defaultInvite);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  const onCopy = () => {
    if (isCopied) return;
    copyToClipboard(inviteUrl);
  };

  const handleChange = (index: number, field: "email" | "name", value: string) => {
    const newInvitees = [...invitees];
    newInvitees[index][field] = value;
    setInvitees(newInvitees);
  };

  const addInviteeField = () => {
    setInvitees([...invitees, { email: "", name: "" }]);
  };

  const removeInviteeField = (index: number) => {
    const newInvitees = invitees.filter((_, i) => i !== index);
    setInvitees(newInvitees);
  };

  const sendInvites = async () => {
    setIsButtonDisabled(true); // Disable the button when sending starts
    setInviteButtonText("Sending...");
    try {
      const response = await fetch("/api/accept-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invitees, // The array of invitees in state
          inviteUrl,
          inviterName,
          inviteMessage,
          teamName: team.name,
        }),
      });

      const data = (await response.json()) as ApiResponse;
      if (response.ok) {
        setInvitees([{ email: "", name: "" }]); // Reset the invitees array
        setInviteButtonText("Sent"); // Update button text to indicate success

        // Show a success message toast notification
        toast.success("Invitations sent successfully");

        // Re-enable the button after a delay or based on further user interaction
        setTimeout(() => {
          setInviteButtonText("Invite");
          setIsButtonDisabled(false);
        }, 3000); // Reset after 3 seconds
      } else {
        throw new Error(data.error || "Failed to send invites");
      }
    } catch (error) {
      console.error("Error sending invites:", error);
      toast.error("An error occured while sending invites.");
      setInviteButtonText("Invite");
      setIsButtonDisabled(false);
    }
  };

  const areInvitesValid = !invitees.some((invitee) => isValidEmail(invitee.email));

  return (
    <Card>
      <div className="w-full space-y-4">
        <h2 className="text-xl">Invite people to your team</h2>
        <div className="flex space-x-2">
          <InputField value={inviteUrl} readOnly className="overflow-hidden text-ellipsis whitespace-nowrap" />
          <Button onClick={onCopy}>{isCopied ? <IconCheck /> : "Copy"}</Button>
        </div>
        <DividerWithText />
        <div className="space-y-4">
          <Label htmlFor="invite-message">Invite Message:</Label>
          <textarea
            id="invite-message"
            className="h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:h-20"
            value={inviteMessage}
            onChange={({ target: { value } }) => setInviteMessage(value)}
          />
          {invitees.map((invitee, index) => (
            <div key={index} className="flex space-x-2">
              <InputField
                value={invitee.email}
                onChange={(e) => handleChange(index, "email", e.target.value)}
                placeholder="Email address"
              />
              <InputField
                value={invitee.name}
                onChange={(e) => handleChange(index, "name", e.target.value)}
                placeholder="Name (optional)"
              />
              {invitees.length > 1 && (
                <Button variant={"outline"} onClick={() => removeInviteeField(index)}>
                  <IconClose />
                </Button>
              )}
            </div>
          ))}
          <div className="flex justify-between">
            <Button variant={"outline"} onClick={addInviteeField}>
              <IconPlus />
              &nbsp;Add another person
            </Button>
            <Button disabled={areInvitesValid || isButtonDisabled} onClick={sendInvites}>
              {inviteButtonText}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

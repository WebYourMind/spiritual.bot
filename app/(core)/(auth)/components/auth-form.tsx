import { type SyntheticEvent, type ReactNode } from "react";
import { ColorWheelIcon } from "@radix-ui/react-icons";
import { Button } from "components/ui/button";

interface AuthFormProps {
  isLoading: boolean;
  onSubmit: (event: SyntheticEvent) => Promise<void | false | undefined>;
  isSubmitDisabled?: boolean;
  children: ReactNode;
}

export default function AuthForm({ isLoading, onSubmit, isSubmitDisabled, children }: AuthFormProps) {
  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit} method="POST">
        <div className="grid gap-4">
          {children}
          <Button disabled={isLoading || isSubmitDisabled}>
            {isLoading && <ColorWheelIcon className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Processing" : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
}

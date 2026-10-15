"use client";

import { useActionState, useRef, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ActionState } from "@/features/admin/action-state";
import { useToast } from "@/components/admin/Toaster";
import { cn } from "@/lib/utils";

type Action = (state: ActionState, form: FormData) => Promise<ActionState>;

/** Server-action form that reports success or failure as a toast instead of an error page. */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  confirm,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  /** Ask before submitting, e.g. for cancellations. */
  confirm?: string;
}) {
  const { notify } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  // Notify as soon as the action resolves, so the toast survives even if this form
  // disappears on re-render (e.g. an order leaving a filtered list once confirmed).
  const [, formAction] = useActionState(async (previous: ActionState, form: FormData) => {
    const result = await action(previous, form);
    // An action that redirects navigates away instead of returning a result.
    if (!result) return previous;
    if (result.status !== "idle") notify(result.status, result.message);
    if (result.status === "success" && resetOnSuccess) formRef.current?.reset();
    return result;
  }, { status: "idle" } as ActionState);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={className}
      onSubmit={(event) => {
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const question = submitter?.dataset.confirm ?? confirm;
        if (question && !window.confirm(question)) event.preventDefault();
      }}
    >
      {children}
    </form>
  );
}

export function SubmitButton({ children, className, pendingLabel, ...props }: ComponentProps<"button"> & { pendingLabel?: string }) {
  const { pending, data } = useFormStatus();
  // Only the clicked button shows a spinner when a form has several submit buttons.
  const mine = pending && (!props.name || data?.get(props.name) === props.value);
  return (
    <button type="submit" disabled={pending} className={cn("disabled:opacity-60", className)} {...props}>
      {mine ? <Loader2 size={15} className="animate-spin" /> : null}
      {mine && pendingLabel ? pendingLabel : children}
    </button>
  );
}

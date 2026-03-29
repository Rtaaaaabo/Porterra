"use client";

import { useFormStatus } from "react-dom";

type Props = {
  idleText: string;
  pendingText?: string;
  className?: string;
};

export default function FormSubmitButton({ idleText, pendingText = "送信中...", className }: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className ?? ""} disabled:cursor-not-allowed disabled:opacity-70`}
    >
      {pending ? pendingText : idleText}
    </button>
  );
}

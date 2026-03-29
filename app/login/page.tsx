import Link from "next/link";
import { loginAction } from "@/app/actions";
import FormSubmitButton from "@/app/components/form-submit-button";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readErrorMessage(error: string | undefined): string | null {
  if (!error) return null;
  if (error === "required") return "メールアドレスとパスワードを入力してください。";
  return error;
}

export default async function LoginPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">ログイン</h1>

      {readErrorMessage(error) ? (
        <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{readErrorMessage(error)}</p>
      ) : null}

      <form action={loginAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">
          メールアドレス
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="you@example.com"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          パスワード
          <input name="password" type="password" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>

        <FormSubmitButton
          idleText="ログイン"
          pendingText="ログイン中..."
          className="w-full rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        />
      </form>

      <p className="mt-4 text-sm text-slate-600">
        アカウント未登録の方は
        <Link href="/register" className="ml-1 font-semibold text-sky-700 hover:text-sky-800">
          新規登録
        </Link>
      </p>
    </main>
  );
}

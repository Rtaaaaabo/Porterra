import Link from "next/link";
import { createPostAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readErrorMessage(error: string | undefined): string | null {
  if (!error) return null;
  if (error === "required") return "タイトル・本文・場所名・国は必須です。";
  if (error === "image_required") return "画像を1枚以上アップロードしてください。";
  return error;
}

export default async function NewPostPage({ searchParams }: Props) {
  const user = await requireUser();
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">新規投稿</h1>
          <p className="text-sm text-slate-600">ログイン中: {user.name}</p>
        </div>
        <Link href="/" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
          一覧へ戻る
        </Link>
      </header>

      {readErrorMessage(error) ? (
        <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{readErrorMessage(error)}</p>
      ) : null}

      <form action={createPostAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">
          タイトル
          <input
            name="title"
            type="text"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="例: 朝焼けの富士山"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          コメント本文
          <textarea
            name="body"
            required
            rows={5}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="旅先の思い出を書いてください"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          写真
          <input name="images" type="file" accept="image/*" multiple required className="mt-1 w-full text-sm" />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            場所名
            <input
              name="spotName"
              type="text"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="例: 河口湖"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            都道府県
            <input
              name="prefecture"
              type="text"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="例: 山梨県"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            国
            <input
              name="country"
              type="text"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="例: 日本"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            緯度（任意）
            <input name="lat" type="number" step="any" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>

          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            経度（任意）
            <input name="lng" type="number" step="any" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
        </div>

        <button type="submit" className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
          投稿する
        </button>
      </form>
    </main>
  );
}

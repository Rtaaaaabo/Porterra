import Link from "next/link";
import { createPostAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readErrorMessage(error: string | undefined): string | null {
  if (!error) return null;
  if (error === "required") return "タイトル・本文は必須です。";
  if (error === "image_required") return "画像を1枚以上アップロードしてください。";
  if (error === "upload_failed") return "画像アップロードに失敗しました。Cloudinary設定を確認してください。";
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
          <span className="mt-1 block rounded-md border border-slate-300 bg-slate-50 px-3 py-3">
            <input
              name="images"
              type="file"
              accept="image/*"
              multiple
              required
              className="w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-sky-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-sky-700"
            />
            <span className="mt-2 block text-xs text-slate-500">複数選択可（JPG / PNG / WEBP など）</span>
          </span>
        </label>

        <p className="text-xs text-slate-500">
          位置情報は写真のEXIF（GPS）から自動取得し、場所名はMap APIで補完します。
        </p>

        <button type="submit" className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
          投稿する
        </button>
      </form>
    </main>
  );
}

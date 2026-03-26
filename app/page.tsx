import Link from "next/link";
import { logoutAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import { getPostFeed } from "@/lib/db";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP");
}

export default async function HomePage() {
  const [user, feed] = await Promise.all([getCurrentUser(), getPostFeed()]);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Porterra</h1>
          <p className="text-sm text-slate-600">旅先の場所と写真をシェアするサービス</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/map"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            マップを見る
          </Link>
          {user ? (
            <>
              <Link
                href="/posts/new"
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
              >
                投稿する
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  ログアウト
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                ログイン
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
              >
                新規登録
              </Link>
            </>
          )}
        </div>
      </header>

      {feed.length === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          まだ投稿がありません。最初の旅先をシェアしてみましょう。
        </section>
      ) : (
        <section className="grid gap-5">
          {feed.map((post) => (
            <article key={post.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {post.imageUrls[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.imageUrls[0]}
                  alt={post.title}
                  className="h-56 w-full object-cover"
                />
              ) : null}
              <div className="space-y-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{post.title}</h2>
                  <span className="text-xs text-slate-500">{formatDate(post.createdAt)}</span>
                </div>
                <p className="line-clamp-2 text-sm text-slate-700">{post.body}</p>
                <div className="text-sm text-slate-600">
                  <p>
                    📍 {post.spotName} / {post.prefecture || "-"} / {post.country}
                  </p>
                  <p>投稿者: {post.authorName}</p>
                  <p>いいね: {post.likeCount}</p>
                </div>
                <Link href={`/posts/${post.id}`} className="inline-block text-sm font-semibold text-sky-700 hover:text-sky-800">
                  投稿詳細を見る →
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

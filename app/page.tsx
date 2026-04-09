import Link from "next/link";
import { logoutAction } from "@/app/actions";
import FormSubmitButton from "@/app/components/form-submit-button";
import { requireUserWhenAccessRestricted } from "@/lib/auth";
import { getPostFeed } from "@/lib/db";
import { resolveSpotLabel } from "@/lib/spot-label";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP");
}

export default async function HomePage() {
  const [user, feed] = await Promise.all([requireUserWhenAccessRestricted(), getPostFeed()]);
  const feedWithSpotLabel = await Promise.all(
    feed.map(async (post) => ({
      ...post,
      spotLabel: await resolveSpotLabel({
        spotName: post.spotName,
        prefecture: post.prefecture,
        country: post.country,
        lat: post.lat,
        lng: post.lng,
      }),
    })),
  );

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
                <FormSubmitButton
                  idleText="ログアウト"
                  pendingText="ログアウト中..."
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                />
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

      {feedWithSpotLabel.length === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          まだ投稿がありません。最初の旅先をシェアしてみましょう。
        </section>
      ) : (
        <section className="grid gap-5">
          {feedWithSpotLabel.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <article>
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
                    <p>📍 {post.spotLabel}</p>
                    <p>投稿者: {post.authorName}</p>
                    <p>いいね: {post.likeCount}</p>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}

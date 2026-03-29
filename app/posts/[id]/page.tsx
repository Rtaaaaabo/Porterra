import Link from "next/link";
import { notFound } from "next/navigation";
import { toggleLikeAction } from "@/app/actions";
import FormSubmitButton from "@/app/components/form-submit-button";
import { getCurrentUser } from "@/lib/auth";
import { getPostDetail } from "@/lib/db";
import DeletePostButton from "@/app/posts/[id]/delete-post-button";

type Props = {
  params: Promise<{ id: string }>;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP");
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  const post = await getPostDetail(id, user?.id);

  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <Link href="/" className="mb-6 inline-block text-sm font-semibold text-sky-700 hover:text-sky-800">
        ← 一覧へ戻る
      </Link>

      <article className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">{post.title}</h1>
          <p className="text-sm text-slate-600">{formatDate(post.createdAt)} / 投稿者: {post.authorName}</p>
          <p className="text-sm text-slate-700">
            📍 {post.spotName} / {post.prefecture || "-"} / {post.country}
          </p>
          {post.lat !== null && post.lng !== null ? (
            <p className="text-xs text-slate-500">
              座標: {post.lat}, {post.lng}
            </p>
          ) : null}
        </header>

        <p className="whitespace-pre-wrap text-slate-800">{post.body}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          {post.imageUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt={post.title} className="h-64 w-full rounded-lg object-cover" />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-700">いいね: {post.likeCount}</p>
          {user ? (
            <form action={toggleLikeAction}>
              <input type="hidden" name="postId" value={post.id} />
              <FormSubmitButton
                idleText={post.hasLiked ? "いいねを取り消す" : "いいね"}
                pendingText="送信中..."
                className="rounded-md border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              />
            </form>
          ) : (
            <Link href="/login" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
              いいねするにはログイン
            </Link>
          )}
          {user?.id === post.authorId ? (
            <DeletePostButton postId={post.id} />
          ) : null}
        </div>
      </article>
    </main>
  );
}

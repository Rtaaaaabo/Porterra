import Link from "next/link";
import { notFound } from "next/navigation";
import { updatePostAction } from "@/app/actions";
import FormSubmitButton from "@/app/components/form-submit-button";
import VisibilityFields from "@/app/posts/visibility-fields";
import { requireUser } from "@/lib/auth";
import { getEditablePostByIdForUser, listUsersForVisibilitySelector } from "@/lib/db";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readErrorMessage(error: string | undefined): string | null {
  if (!error) return null;
  if (error === "required") return "タイトル・本文は必須です。";
  return error;
}

export default async function EditPostPage({ params, searchParams }: Props) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;

  const [post, users] = await Promise.all([
    getEditablePostByIdForUser(id, user.id),
    listUsersForVisibilitySelector(user.id),
  ]);

  if (!post) {
    notFound();
  }

  const error =
    typeof query.error === "string" ? query.error : undefined;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">投稿を編集</h1>
          <p className="text-sm text-slate-600">投稿ID: {post.id}</p>
        </div>
        <Link href={`/posts/${post.id}`} className="text-sm font-semibold text-sky-700 hover:text-sky-800">
          投稿詳細へ戻る
        </Link>
      </header>

      {readErrorMessage(error) ? (
        <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{readErrorMessage(error)}</p>
      ) : null}

      <form action={updatePostAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <input type="hidden" name="postId" value={post.id} />

        <label className="block text-sm font-medium text-slate-700">
          タイトル
          <input
            name="title"
            type="text"
            required
            defaultValue={post.title}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          コメント本文
          <textarea
            name="body"
            required
            rows={6}
            defaultValue={post.body}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <VisibilityFields
          users={users}
          defaultVisibility={post.visibility}
          defaultVisibleToUserIds={post.visibleToUserIds}
        />

        <FormSubmitButton
          idleText="更新する"
          pendingText="更新中..."
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        />
      </form>
    </main>
  );
}

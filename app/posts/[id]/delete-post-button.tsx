"use client";

import { deletePostAction } from "@/app/actions";

type Props = {
  postId: string;
};

export default function DeletePostButton({ postId }: Props) {
  return (
    <form
      action={deletePostAction}
      onSubmit={(event) => {
        const ok = window.confirm("この投稿を削除しますか？この操作は取り消せません。");
        if (!ok) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="postId" value={postId} />
      <button
        type="submit"
        className="rounded-md border border-rose-300 px-3 py-1 text-sm font-semibold text-rose-700 hover:bg-rose-50"
      >
        投稿を削除
      </button>
    </form>
  );
}

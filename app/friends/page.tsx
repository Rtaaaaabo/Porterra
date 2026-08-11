import Link from "next/link";
import {
  acceptFriendRequestAction,
  cancelFriendRequestAction,
  rejectFriendRequestAction,
  removeFriendAction,
  sendFriendRequestAction,
} from "@/app/actions";
import FormSubmitButton from "@/app/components/form-submit-button";
import { requireUser } from "@/lib/auth";
import { getFriendsOverview } from "@/lib/db";
import type { FriendUser } from "@/lib/types";

export const dynamic = "force-dynamic";

const ERROR_MESSAGE: Record<string, string> = {
  cannot_friend_self: "自分自身には申請できません。",
  already_related: "すでに申請済み、または友達です。",
  already_accepted: "すでに承認済みの関係です。",
  not_found: "対象が見つかりませんでした。",
  invalid_request: "リクエストの形式が正しくありません。",
};

const DONE_MESSAGE: Record<string, string> = {
  requested: "友達申請を送りました。相手が承認すると友達になります。",
  accepted: "相手からの申請があったため、そのまま友達になりました。",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP");
}

function UserLabel({ user }: { user: FriendUser }) {
  return (
    <span>
      {user.name}
      <span className="ml-1 text-xs text-slate-500">({user.email})</span>
    </span>
  );
}

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const overview = await getFriendsOverview(user.id);

  const errorCode = typeof params.error === "string" ? params.error : null;
  const doneCode = typeof params.done === "string" ? params.done : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">友達</h1>
          <p className="text-sm text-slate-600">
            承認された相手だけが、公開範囲「友達のみ」の投稿を見られます。
          </p>
        </div>
        <Link
          href="/"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          投稿一覧へ
        </Link>
      </header>

      {errorCode ? (
        <p
          role="alert"
          className="mb-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {ERROR_MESSAGE[errorCode] ?? "処理できませんでした。"}
        </p>
      ) : null}
      {doneCode ? (
        <p className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {DONE_MESSAGE[doneCode] ?? "完了しました。"}
        </p>
      ) : null}

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          届いている申請
          {overview.received.length > 0 ? (
            <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
              {overview.received.length}
            </span>
          ) : null}
        </h2>
        {overview.received.length === 0 ? (
          <p className="text-sm text-slate-500">届いている申請はありません。</p>
        ) : (
          <ul className="space-y-2">
            {overview.received.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700"
              >
                <span>
                  <UserLabel user={request.user} />
                  <span className="ml-2 text-xs text-slate-400">
                    {formatDate(request.createdAt)}
                  </span>
                </span>
                <span className="flex gap-2">
                  <form action={acceptFriendRequestAction}>
                    <input type="hidden" name="friendshipId" value={request.id} />
                    <FormSubmitButton
                      idleText="承認"
                      pendingText="承認中..."
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                    />
                  </form>
                  <form action={rejectFriendRequestAction}>
                    <input type="hidden" name="friendshipId" value={request.id} />
                    <FormSubmitButton
                      idleText="拒否"
                      pendingText="処理中..."
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                    />
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          友達（{overview.friends.length}）
        </h2>
        {overview.friends.length === 0 ? (
          <p className="text-sm text-slate-500">
            まだ友達がいません。下から申請を送ってみてください。
          </p>
        ) : (
          <ul className="space-y-2">
            {overview.friends.map((friend) => (
              <li
                key={friend.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700"
              >
                <UserLabel user={friend} />
                <form action={removeFriendAction}>
                  <input type="hidden" name="friendUserId" value={friend.id} />
                  <FormSubmitButton
                    idleText="解除"
                    pendingText="解除中..."
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                  />
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {overview.sent.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">送った申請</h2>
          <ul className="space-y-2">
            {overview.sent.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700"
              >
                <span>
                  <UserLabel user={request.user} />
                  <span className="ml-2 text-xs text-slate-400">承認待ち</span>
                </span>
                <form action={cancelFriendRequestAction}>
                  <input type="hidden" name="friendshipId" value={request.id} />
                  <FormSubmitButton
                    idleText="取り消す"
                    pendingText="処理中..."
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                  />
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">友達を探す</h2>
        {overview.candidates.length === 0 ? (
          <p className="text-sm text-slate-500">申請できるユーザーがいません。</p>
        ) : (
          <ul className="space-y-2">
            {overview.candidates.map((candidate) => (
              <li
                key={candidate.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700"
              >
                <UserLabel user={candidate} />
                <form action={sendFriendRequestAction}>
                  <input type="hidden" name="targetUserId" value={candidate.id} />
                  <FormSubmitButton
                    idleText="申請する"
                    pendingText="送信中..."
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                  />
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-10 text-xs text-slate-500">
        申請の通知は行いません。相手はこの画面を開くまで申請に気づきません。
      </p>
    </main>
  );
}

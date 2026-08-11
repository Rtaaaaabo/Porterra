"use client";

import { useMemo, useState } from "react";
import type { PostVisibilityValue } from "@/lib/post-visibility";
import type { VisibilitySelectableUser } from "@/lib/types";

type Props = {
  users: VisibilitySelectableUser[];
  defaultVisibility: PostVisibilityValue;
  defaultVisibleToUserIds?: string[];
  /** 承認済みの友達の人数。0 人のときに注意書きを出すために使う */
  friendCount: number;
};

export default function VisibilityFields({
  users,
  defaultVisibility,
  defaultVisibleToUserIds = [],
  friendCount,
}: Props) {
  const [visibility, setVisibility] =
    useState<PostVisibilityValue>(defaultVisibility);

  const selectedUserIds = useMemo(
    () => new Set(defaultVisibleToUserIds),
    [defaultVisibleToUserIds],
  );

  return (
    <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
      <legend className="px-1 text-sm font-semibold text-slate-800">公開範囲</legend>

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="radio"
          name="visibility"
          value="PUBLIC"
          checked={visibility === "PUBLIC"}
          onChange={() => setVisibility("PUBLIC")}
          className="mt-0.5"
        />
        <span>
          全員
          <span className="block text-xs text-slate-500">ログイン状態に関係なく表示します。</span>
        </span>
      </label>

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="radio"
          name="visibility"
          value="FRIENDS"
          checked={visibility === "FRIENDS"}
          onChange={() => setVisibility("FRIENDS")}
          className="mt-0.5"
        />
        <span>
          友達のみ
          <span className="block text-xs text-slate-500">
            友達申請を承認し合った相手だけが見られます。
          </span>
        </span>
      </label>

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="radio"
          name="visibility"
          value="CUSTOM"
          checked={visibility === "CUSTOM"}
          onChange={() => setVisibility("CUSTOM")}
          className="mt-0.5"
        />
        <span>
          自分のみ
          <span className="block text-xs text-slate-500">
            自分だけ見える状態。必要なら下で公開相手を選べます。
          </span>
        </span>
      </label>

      {visibility === "FRIENDS" && friendCount === 0 ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          まだ友達がいないため、この投稿を見られるのはあなただけです。
          <a href="/friends" className="ml-1 underline">
            友達を追加する
          </a>
        </p>
      ) : null}

      {visibility === "CUSTOM" ? (
        <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-600">公開する相手（任意）</p>
          {users.length === 0 ? (
            <p className="text-xs text-slate-500">
              選択可能なユーザーがいません。現在は自分のみ公開になります。
            </p>
          ) : (
            <div className="max-h-44 space-y-2 overflow-auto pr-1">
              {users.map((target) => (
                <label key={target.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="visibleToUserIds"
                    value={target.id}
                    defaultChecked={selectedUserIds.has(target.id)}
                  />
                  <span>
                    {target.name}
                    <span className="ml-1 text-xs text-slate-500">({target.email})</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </fieldset>
  );
}

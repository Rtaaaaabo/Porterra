"use client";

import dynamic from "next/dynamic";
import type { PostMapPoint } from "@/lib/types";

const PostsMap = dynamic(() => import("@/app/map/posts-map"), {
  ssr: false,
  loading: () => <p className="text-sm text-slate-600">地図を読み込み中...</p>,
});

type Props = {
  points: PostMapPoint[];
};

export default function MapClient({ points }: Props) {
  return <PostsMap points={points} />;
}

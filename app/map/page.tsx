import Link from "next/link";
import MapClient from "@/app/map/map-client";
import { getPostMapPoints } from "@/lib/db";

export default async function MapPage() {
  const points = await getPostMapPoints();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">投稿マップ</h1>
          <p className="text-sm text-slate-600">投稿された場所をクラスタ表示します（拡大で細分化）</p>
        </div>
        <Link href="/" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
          一覧へ戻る
        </Link>
      </header>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        {points.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">位置情報付きの投稿がまだありません。</p>
        ) : (
          <MapClient points={points} />
        )}
      </section>
    </main>
  );
}

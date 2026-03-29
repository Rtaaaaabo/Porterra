export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/85 backdrop-blur-sm">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <span className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600" />
        <p className="text-sm font-medium text-slate-700">読み込み中...</p>
      </div>
    </div>
  );
}

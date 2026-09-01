export function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-nfl-navy border-t-transparent" />
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

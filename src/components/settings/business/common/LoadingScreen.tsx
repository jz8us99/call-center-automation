export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-black dark:text-white">Loading configuration...</p>
      </div>
    </div>
  );
}

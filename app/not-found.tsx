export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-candy text-foreground">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-candy p-10 text-center space-y-4">
        <h1 className="text-5xl font-black">404</h1>
        <p className="text-muted-foreground max-w-sm">
          The candy round you&apos;re searching for has melted away. Check the lobby for active encrypted games.
        </p>
      </div>
    </div>
  );
}

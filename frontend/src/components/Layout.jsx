export default function Layout({ sidebar, children }) {
  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 bg-primary text-white flex items-center px-6 shadow">
        <h1 className="text-xl font-semibold">🔥 EmberAI Dashboard</h1>
      </header>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar never moves under the map */}
        <aside className="w-72 bg-gray-100 p-4 overflow-y-auto">
          {sidebar}
        </aside>

        {/* Main is relative, Leaflet will absolutely position itself here */}
        <main className="flex-1 relative">{children}</main>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default function DisputesPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>
        <p className="text-gray-500 text-sm mt-1">Manage farmer-consumer disputes</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
        <p className="text-5xl mb-4">⚖️</p>
        <p className="text-gray-700 font-semibold text-lg">No disputes yet</p>
        <p className="text-gray-400 text-sm mt-2">Disputes raised by farmers or consumers will appear here for resolution.</p>
      </div>
    </div>
  );
}

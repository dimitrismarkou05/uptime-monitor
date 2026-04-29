import DashboardShell from "../components/layout/DashboardShell";
import { useAuthStore } from "../stores/authStore";

export default function Settings() {
  const { user } = useAuthStore();

  return (
    <DashboardShell>
      <div className="w-full space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your account details and application preferences.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">
              Account Profile
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 rounded-md shadow-sm max-w-md">
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 sm:text-sm"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Your email address is currently used for all uptime alerts.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                User ID
              </label>
              <div className="mt-1">
                <code className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-600">
                  {user?.id}
                </code>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Preferences</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 italic">
              Notification and theme preferences coming soon.
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

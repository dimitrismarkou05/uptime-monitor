import { useState } from "react";
import DashboardShell from "../components/layout/DashboardShell";
import { useAuthStore } from "../stores/authStore";
import { updateEmail, updatePassword, requestPasswordReset } from "../api/auth";
import { deleteAccount } from "../api/users";

// Helper to safely extract error messages
const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "An unexpected error occurred";
};

export default function Settings() {
  const { user, logout } = useAuthStore();

  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");

  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email === user?.email) return;
    setIsLoading(true);
    setStatus(null);
    try {
      await updateEmail(email);
      setStatus({
        type: "success",
        msg: "Verification link sent to new email.",
      });
    } catch (err) {
      setStatus({ type: "error", msg: getErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsLoading(true);
    setStatus(null);
    try {
      await updatePassword(password);
      setStatus({ type: "success", msg: "Password updated successfully." });
      setPassword("");
    } catch (err) {
      setStatus({ type: "error", msg: getErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetRequest = async () => {
    if (!user?.email) return;
    setIsLoading(true);
    try {
      await requestPasswordReset(user.email);
      setStatus({
        type: "success",
        msg: "Password reset instructions sent to your email.",
      });
    } catch (err) {
      setStatus({ type: "error", msg: getErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you absolutely sure? This will delete your account, monitors, and ping history permanently.",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteAccount();
      logout();
    } catch (err) {
      setStatus({ type: "error", msg: getErrorMessage(err) });
      setIsDeleting(false);
    }
  };

  return (
    <DashboardShell>
      <div className="w-full space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your account credentials and security.
          </p>
        </div>

        {status && (
          <div
            className={`p-4 rounded-md ${status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
          >
            {status.msg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Email Card */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">
                Email Address
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || email === user?.email}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  Update Email
                </button>
              </form>
            </div>
          </div>

          {/* Password Card */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">Password</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <input
                    type="password"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isLoading || !password}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                  >
                    Set Password
                  </button>
                  <button
                    type="button"
                    onClick={handleResetRequest}
                    disabled={isLoading}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50 cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-lg border border-red-200 bg-white">
          <div className="border-b border-red-200 bg-red-50 px-6 py-4 rounded-t-lg">
            <h2 className="text-lg font-medium text-red-800">Danger Zone</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">
              Permanently delete your account and all monitoring data. This
              action cannot be undone.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

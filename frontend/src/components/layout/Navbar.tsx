import { useAuthStore } from "../../stores/authStore";
import { Link } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <nav className="border-b border-gray-200 bg-white px-6 py-3">
      <div className="flex items-center justify-between">
        <Link className="flex items-center gap-2" to={"/"}>
          <div className="h-7 w-7 pt-1">
            <img src="../../../public/favicon.svg" alt="Uptime Monitor" />
          </div>
          <span className="font-semibold text-gray-900">Uptime Monitor</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.email}</span>
          <Link
            to="/settings"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          >
            Settings
          </Link>
          <button
            onClick={logout}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

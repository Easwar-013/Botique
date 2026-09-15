import React from 'react';

import {
  Mail,
  Phone,
  User,
  LogOut,
  ShoppingBag,
  Heart,
  MapPin,
} from 'lucide-react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

const Profile: React.FC = () => {
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  /*
   * Safety:
   * Profile is only available to logged-in users.
   */
  if (!user) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
            BOUTIQUE
          </p>

          <h1 className="mt-4 text-3xl font-light">
            Please Sign In
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            Sign in to view your account.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate('/login')
            }
            className="mt-7 rounded-full bg-black px-7 py-3 text-sm text-white transition hover:bg-gray-800"
          >
            Sign In
          </button>
        </div>
      </section>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <section className="mx-auto max-w-5xl px-6 py-14 lg:px-8">

      {/* Header */}
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
          BOUTIQUE
        </p>

        <h1 className="mt-3 text-4xl font-light">
          My Profile
        </h1>

        <p className="mt-3 text-sm text-gray-500">
          Manage your account and shopping preferences.
        </p>
      </div>

      {/* Profile Card */}
      <div className="mx-auto mt-12 max-w-3xl border border-gray-200 bg-white">

        {/* Top section */}
        <div className="flex flex-col items-center border-b px-6 py-10 text-center sm:flex-row sm:text-left">

          {/* Avatar */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-black text-white">
            {user.name
              ? user.name
                  .charAt(0)
                  .toUpperCase()
              : 'U'}
          </div>

          <div className="mt-5 sm:ml-6 sm:mt-0">
            <h2 className="text-2xl font-light">
              {user.name}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {user.email}
            </p>
          </div>

        </div>

        {/* Account Information */}
        <div className="px-6 py-8">

          <h3 className="text-lg font-medium">
            Account Information
          </h3>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">

            {/* Name */}
            <div className="border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <User
                  size={18}
                  className="text-gray-500"
                />

                <span className="text-xs uppercase tracking-wider text-gray-400">
                  Name
                </span>
              </div>

              <p className="mt-3 text-sm">
                {user.name}
              </p>
            </div>

            {/* Email */}
            <div className="border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <Mail
                  size={18}
                  className="text-gray-500"
                />

                <span className="text-xs uppercase tracking-wider text-gray-400">
                  Email
                </span>
              </div>

              <p className="mt-3 break-all text-sm">
                {user.email}
              </p>
            </div>

            {/* Phone */}
            <div className="border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <Phone
                  size={18}
                  className="text-gray-500"
                />

                <span className="text-xs uppercase tracking-wider text-gray-400">
                  Phone
                </span>
              </div>

              <p className="mt-3 text-sm">
                {user.phone ||
                  'Not added'}
              </p>
            </div>

            {/* Account Type */}
            <div className="border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <User
                  size={18}
                  className="text-gray-500"
                />

                <span className="text-xs uppercase tracking-wider text-gray-400">
                  Account Type
                </span>
              </div>

              <p className="mt-3 text-sm capitalize">
                {user.role}
              </p>
            </div>

          </div>
        </div>

        {/* Quick Links */}
        <div className="border-t px-6 py-8">

          <h3 className="text-lg font-medium">
            Quick Links
          </h3>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">

            <Link
              to="/orders"
              className="flex items-center gap-3 border border-gray-200 px-4 py-4 text-sm transition hover:border-black"
            >
              <ShoppingBag
                size={18}
              />

              My Orders
            </Link>

            <Link
              to="/wishlist"
              className="flex items-center gap-3 border border-gray-200 px-4 py-4 text-sm transition hover:border-black"
            >
              <Heart
                size={18}
              />

              Wishlist
            </Link>

            <Link
              to="/cart"
              className="flex items-center gap-3 border border-gray-200 px-4 py-4 text-sm transition hover:border-black"
            >
              <MapPin
                size={18}
              />

              My Cart
            </Link>

          </div>
        </div>

        {/* Logout */}
        <div className="border-t px-6 py-6">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-black py-3.5 text-sm transition hover:bg-black hover:text-white"
          >
            <LogOut
              size={17}
            />

            Sign Out
          </button>
        </div>

      </div>
    </section>
  );
};

export default Profile;
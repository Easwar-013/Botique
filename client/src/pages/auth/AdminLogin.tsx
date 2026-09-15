import React, {
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  LockKeyhole,
  User,
} from 'lucide-react';

import {
  useAuth,
} from '../../context/AuthContext';

const AdminLogin: React.FC = () => {
  const navigate =
    useNavigate();

  const {
    adminLogin,
    loading,
  } = useAuth();

  const [
    username,
    setUsername,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      const loggedUser =
        await adminLogin(
          username.trim(),
          password
        );

      /*
       * Only allow admin/staff accounts
       * into the admin portal.
       */
      if (
        loggedUser.role !== 'admin' &&
        loggedUser.role !== 'staff' &&
        loggedUser.role !== 'superadmin'
      ) {
        alert(
          'You do not have admin access.'
        );

        return;
      }

      navigate('/admin', {
        replace: true,
      });
    } catch (error: any) {
      console.error(
        'Admin login error:',
        error
      );

      alert(
        error?.response?.data?.message ||
          error?.message ||
          'Invalid admin credentials'
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-6">

      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">

        {/* Header */}
        <div className="text-center">

          <p className="text-xs font-medium uppercase tracking-[0.3em] text-gray-400">
            BOUTIQUE
          </p>

          <h1 className="mt-3 text-3xl font-light">
            Admin Portal
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Sign in to manage your boutique
          </p>

        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >

          {/* Username */}
          <div>

            <label className="mb-2 block text-sm font-medium">
              Username
            </label>

            <div className="relative">

              <User
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
                placeholder="Admin username"
                autoComplete="username"
                className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 outline-none transition focus:border-black"
                required
              />

            </div>

          </div>

          {/* Password */}
          <div>

            <label className="mb-2 block text-sm font-medium">
              Password
            </label>

            <div className="relative">

              <LockKeyhole
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="Admin password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 outline-none transition focus:border-black"
                required
              />

            </div>

          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={
              loading
            }
            className="w-full rounded-xl bg-black py-3.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? 'Signing In...'
              : 'Sign In to Admin'}
          </button>

        </form>

      </div>

    </div>
  );
};

export default AdminLogin;
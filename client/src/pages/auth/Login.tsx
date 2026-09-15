import React, {
  useState,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import {
  GoogleLogin,
} from '@react-oauth/google';

import { useAuth } from '../../context/AuthContext';

const Login: React.FC = () => {
  const navigate =
    useNavigate();

  const {
    login,
    googleLogin,
    loading,
  } = useAuth();

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [
    googleLoading,
    setGoogleLoading,
  ] = useState(false);

  const handleSubmit =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      try {
        const user =
          await login(
            email,
            password
          );

        if (
          user.role ===
            'admin' ||
          user.role ===
            'staff' ||
          user.role ===
            'superadmin'
        ) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } catch (error: any) {
        alert(
          error?.response?.data
            ?.message ||
            'Login failed'
        );
      }
    };

  const handleGoogleSuccess =
    async (
      credential?: string
    ) => {
      if (!credential) {
        alert(
          'Google login failed. No credential received.'
        );
        return;
      }

      try {
        setGoogleLoading(true);

        const user =
          await googleLogin(
            credential
          );

        if (
          user.role ===
            'admin' ||
          user.role ===
            'staff' ||
          user.role ===
            'superadmin'
        ) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } catch (error: any) {
        console.error(
          'Google login error:',
          error
        );

        alert(
          error?.response?.data
            ?.message ||
            'Google sign in failed'
        );
      } finally {
        setGoogleLoading(false);
      }
    };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <form
        onSubmit={
          handleSubmit
        }
        className="w-full max-w-md"
      >
        <p className="text-center text-xs uppercase tracking-[0.3em] text-gray-400">
          Welcome Back
        </p>

        <h1 className="mt-4 text-center text-4xl font-light">
          Sign In
        </h1>

        <div className="mt-10 space-y-5">

          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-black"
            required
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-black"
            required
          />

          {/* Normal Login */}
          <button
            type="submit"
            disabled={
              loading ||
              googleLoading
            }
            className="w-full rounded-xl bg-black py-3 text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {loading
              ? 'Signing In...'
              : 'Sign In'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />

            <span className="text-xs text-gray-400">
              OR
            </span>

            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Google */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={(
                response
              ) =>
                handleGoogleSuccess(
                  response.credential
                )
              }
              onError={() =>
                alert(
                  'Google sign in failed'
                )
              }
              text="signin_with"
              theme="outline"
              size="large"
              width="400"
            />
          </div>

          {googleLoading && (
            <p className="text-center text-xs text-gray-500">
              Signing in with Google...
            </p>
          )}

        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}

          <Link
            to="/register"
            className="font-medium text-black underline"
          >
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
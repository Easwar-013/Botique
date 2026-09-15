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

const Register: React.FC = () => {
  const navigate =
    useNavigate();

  const {
    register,
    googleLogin,
    loading,
  } = useAuth();

  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [phone, setPhone] =
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
        await register(
          name,
          email,
          password,
          phone
        );

        navigate('/');
      } catch (error: any) {
        alert(
          error?.response?.data
            ?.message ||
            'Registration failed'
        );
      }
    };

  const handleGoogleSuccess =
    async (
      credential?: string
    ) => {
      if (!credential) {
        alert(
          'Google registration failed. No credential received.'
        );
        return;
      }

      try {
        setGoogleLoading(true);

        await googleLogin(
          credential
        );

        navigate('/');
      } catch (error: any) {
        console.error(
          'Google registration error:',
          error
        );

        alert(
          error?.response?.data
            ?.message ||
            'Google registration failed'
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
          BOUTIQUE
        </p>

        <h1 className="mt-4 text-center text-4xl font-light">
          Create Account
        </h1>

        <div className="mt-10 space-y-5">

          {/* Name */}
          <input
            placeholder="Full name"
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-black"
            required
          />

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

          {/* Phone */}
          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) =>
              setPhone(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-black"
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

          {/* Create Account */}
          <button
            type="submit"
            disabled={
              loading ||
              googleLoading
            }
            className="w-full rounded-xl bg-black py-3 text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {loading
              ? 'Creating Account...'
              : 'Create Account'}
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
                  'Google registration failed'
                )
              }
              text="signup_with"
              theme="outline"
              size="large"
              width="400"
            />
          </div>

          {googleLoading && (
            <p className="text-center text-xs text-gray-500">
              Creating your Google account...
            </p>
          )}

        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}

          <Link
            to="/login"
            className="font-medium text-black underline"
          >
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Mail,
  Search,
  Phone,
  UserRound,
  RefreshCw,
  UserCheck,
} from 'lucide-react';

import api from '../../services/api';

interface Customer {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  avatar?: string | null;
  googleId?: string;
}

const getInitial = (
  name: string
): string => {
  return (
    name
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || 'U'
  );
};

const Customers: React.FC = () => {
  const [
    customers,
    setCustomers,
  ] = useState<Customer[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    search,
    setSearch,
  ] = useState('');

  const loadCustomers =
    useCallback(
      async (
        showRefresh = false
      ) => {
        try {
          if (showRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError('');

          const response =
            await api.get(
              '/customers',
              {
                params: {
                  search:
                    search.trim() ||
                    undefined,
                },
              }
            );

          const customerList =
            response.data
              ?.customers ||
            response.data
              ?.users ||
            [];

          setCustomers(
            Array.isArray(
              customerList
            )
              ? customerList
              : []
          );
        } catch (error: any) {
          console.error(
            'Customers error:',
            error
          );

          const status =
            error?.response
              ?.status;

          if (status === 403) {
            setError(
              'You do not have permission to view customers.'
            );
          } else if (
            status === 404
          ) {
            setError(
              'Customer API route was not found. Make sure /api/customers is registered on the server.'
            );
          } else {
            setError(
              error?.response
                ?.data
                ?.message ||
                'Failed to load customers.'
            );
          }

          setCustomers([]);
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [search]
    );

  /*
   * Initial load
   */
  useEffect(() => {
    loadCustomers();
  }, []);

  /*
   * Search with a small delay.
   */
  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        loadCustomers();
      }, 350);

    return () =>
      window.clearTimeout(
        timer
      );
  }, [search]);

  const filteredCustomers =
    useMemo(() => {
      /*
       * Server already filters,
       * but keeping this local filter
       * makes the UI responsive too.
       */
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return customers;
      }

      return customers.filter(
        (customer) => {
          return (
            customer.name
              ?.toLowerCase()
              .includes(query) ||
            customer.email
              ?.toLowerCase()
              .includes(query) ||
            customer.phone
              ?.toLowerCase()
              .includes(query)
          );
        }
      );
    }, [
      customers,
      search,
    ]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-gray-500">
            Customer Management
          </p>

          <h1 className="mt-1 text-3xl font-semibold">
            Customers
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {customers.length}{' '}
            customer
            {customers.length ===
            1
              ? ''
              : 's'}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadCustomers(true)
          }
          disabled={refreshing}
          className="flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm transition hover:border-black disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={
              refreshing
                ? 'animate-spin'
                : ''
            }
          />

          Refresh
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-white">

        {/* Search */}
        <div className="border-b border-gray-100 p-5">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search customers..."
              className="w-full rounded-xl border border-gray-200 px-11 py-3 outline-none transition focus:border-black"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">
            Loading customers...
          </div>
        ) : filteredCustomers.length ===
          0 ? (
          <div className="p-14 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <UserRound
                size={24}
                className="text-gray-400"
              />
            </div>

            <p className="mt-4 text-base font-medium text-gray-900">
              {search.trim()
                ? 'No matching customers'
                : 'No customers found'}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {search.trim()
                ? 'Try a different name, email or phone number.'
                : 'Customers will appear here after they register.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">

              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-5 py-4 text-sm font-medium">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-sm font-medium">
                    Email
                  </th>

                  <th className="px-5 py-4 text-sm font-medium">
                    Phone
                  </th>

                  <th className="px-5 py-4 text-sm font-medium">
                    Login
                  </th>

                  <th className="px-5 py-4 text-sm font-medium">
                    Status
                  </th>

                  <th className="px-5 py-4 text-sm font-medium">
                    Joined
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map(
                  (customer) => {
                    const initial =
                      getInitial(
                        customer.name
                      );

                    const isGoogleUser =
                      !!customer.googleId;

                    return (
                      <tr
                        key={
                          customer._id ||
                          customer.id
                        }
                        className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50"
                      >

                        {/* Customer */}
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">

                            {/* Avatar */}
                            {customer.avatar ? (
                              <img
                                src={
                                  customer.avatar
                                }
                                alt={
                                  customer.name
                                }
                                className="h-11 w-11 rounded-full object-cover"
                                onError={(
                                  event
                                ) => {
                                  event.currentTarget.style.display =
                                    'none';

                                  const fallback =
                                    event
                                      .currentTarget
                                      .nextElementSibling;

                                  if (
                                    fallback instanceof
                                    HTMLElement
                                  ) {
                                    fallback.classList.remove(
                                      'hidden'
                                    );
                                  }
                                }}
                              />
                            ) : null}

                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-sm font-medium text-white ${
                                customer.avatar
                                  ? 'hidden'
                                  : ''
                              }`}
                            >
                              {initial}
                            </div>

                            <div className="min-w-0">
                              <p className="font-medium text-gray-900">
                                {
                                  customer.name
                                }
                              </p>

                              <p className="text-xs text-gray-400">
                                {customer.role ||
                                  'customer'}
                              </p>
                            </div>

                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-5 py-5 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail
                              size={15}
                              className="shrink-0 text-gray-400"
                            />

                            <span>
                              {
                                customer.email
                              }
                            </span>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="px-5 py-5 text-sm text-gray-600">
                          <div className="flex items-center gap-2">

                            {customer.phone ? (
                              <Phone
                                size={15}
                                className="text-gray-400"
                              />
                            ) : null}

                            <span>
                              {customer.phone ||
                                '-'}
                            </span>

                          </div>
                        </td>

                        {/* Login Method */}
                        <td className="px-5 py-5">
                          {isGoogleUser ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                              <span className="font-bold">
                                G
                              </span>

                              Google
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
                              <UserCheck
                                size={13}
                              />

                              Email
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-5">
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                              customer.isActive ===
                              false
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {customer.isActive ===
                            false
                              ? 'Inactive'
                              : 'Active'}
                          </span>
                        </td>

                        {/* Joined */}
                        <td className="px-5 py-5 text-sm text-gray-500">
                          {customer.createdAt
                            ? new Date(
                                customer.createdAt
                              ).toLocaleDateString(
                                'en-IN',
                                {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )
                            : '-'}
                        </td>

                      </tr>
                    );
                  }
                )}
              </tbody>

            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default Customers;
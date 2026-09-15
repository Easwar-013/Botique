import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Package,
  RefreshCw,
  ShoppingBag,
  MapPin,
} from 'lucide-react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import api from '../../services/api';

import {
  useAuth,
} from '../../context/AuthContext';

import {
  getImageUrl,
} from '../../utils/imageUrl';

interface OrderItem {
  product?: string;
  name: string;
  image?: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

interface Order {
  _id: string;

  items: OrderItem[];

  subtotal: number;

  shippingCharge: number;

  discount: number;

  totalAmount: number;

  couponCode?: string;

  paymentMethod: string;

  paymentStatus:
    | 'Pending'
    | 'Paid'
    | 'Failed'
    | 'Refunded';

  orderStatus:
    | 'Pending'
    | 'Confirmed'
    | 'Processing'
    | 'Shipped'
    | 'Out for Delivery'
    | 'Delivered'
    | 'Cancelled'
    | 'Returned';

  createdAt?: string;

  shippingAddress?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

const getStatusClasses = (
  status: string
): string => {
  switch (status) {
    case 'Delivered':
      return 'bg-green-100 text-green-700';

    case 'Cancelled':
      return 'bg-red-100 text-red-700';

    case 'Shipped':
      return 'bg-blue-100 text-blue-700';

    case 'Out for Delivery':
      return 'bg-indigo-100 text-indigo-700';

    case 'Processing':
      return 'bg-yellow-100 text-yellow-700';

    case 'Confirmed':
      return 'bg-purple-100 text-purple-700';

    case 'Returned':
      return 'bg-orange-100 text-orange-700';

    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const Orders: React.FC = () => {
  const navigate =
    useNavigate();

  const {
    isAuthenticated,
  } = useAuth();

  const [
    orders,
    setOrders,
  ] = useState<Order[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const loadOrders =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError('');

          const response =
            await api.get(
              '/orders/my-orders'
            );

          const orderList =
            response.data
              ?.orders;

          setOrders(
            Array.isArray(
              orderList
            )
              ? orderList
              : []
          );
        } catch (requestError: any) {
          console.error(
            'Orders error:',
            requestError
          );

          if (
            requestError?.response
              ?.status === 401
          ) {
            navigate('/login', {
              replace: true,
            });

            return;
          }

          setError(
            requestError?.response
              ?.data?.message ||
              'Unable to load your orders.'
          );

          setOrders([]);
        } finally {
          setLoading(false);
        }
      },
      [navigate]
    );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', {
        replace: true,
      });

      return;
    }

    loadOrders();
  }, [
    isAuthenticated,
    loadOrders,
    navigate,
  ]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-14 lg:px-8">

      {/* Header */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
            BOUTIQUE
          </p>

          <h1 className="mt-3 text-4xl font-light">
            My Orders
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            Track your BOUTIQUE orders here.
          </p>
        </div>

        <button
          type="button"
          onClick={
            loadOrders
          }
          disabled={loading}
          className="flex w-fit items-center gap-2 rounded-full border border-gray-200 px-4 py-2.5 text-sm transition hover:border-black disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={
              loading
                ? 'animate-spin'
                : ''
            }
          />

          Refresh
        </button>

      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-12 space-y-5">

          {[1, 2, 3].map(
            (item) => (
              <div
                key={item}
                className="animate-pulse border border-gray-200 p-6"
              >
                <div className="h-5 w-40 bg-gray-100" />

                <div className="mt-5 h-20 w-full bg-gray-100" />

                <div className="mt-5 h-4 w-32 bg-gray-100" />
              </div>
            )
          )}

        </div>
      )}

      {/* Error */}
      {!loading &&
        error && (
          <div className="mt-12 border border-red-200 bg-red-50 p-8 text-center">

            <p className="text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={
                loadOrders
              }
              className="mt-5 rounded-full bg-black px-6 py-3 text-sm text-white"
            >
              Try Again
            </button>

          </div>
        )}

      {/* Empty */}
      {!loading &&
        !error &&
        orders.length === 0 && (
          <div className="mt-12 flex min-h-[45vh] flex-col items-center justify-center text-center">

            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <ShoppingBag
                size={27}
                className="text-gray-400"
              />
            </div>

            <h2 className="mt-5 text-2xl font-light">
              No Orders Yet
            </h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              When you place an order, it will
              appear here.
            </p>

            <Link
              to="/shop"
              className="mt-7 rounded-full bg-black px-7 py-3 text-sm text-white transition hover:bg-gray-800"
            >
              Start Shopping
            </Link>

          </div>
        )}

      {/* Orders */}
      {!loading &&
        !error &&
        orders.length > 0 && (
          <div className="mt-10 space-y-6">

            {orders.map(
              (order) => {
                const itemCount =
                  order.items?.reduce(
                    (
                      total,
                      item
                    ) =>
                      total +
                      Number(
                        item.quantity ||
                          0
                      ),
                    0
                  ) || 0;

                const orderTotal =
                  Number(
                    order.totalAmount ||
                      0
                  );

                return (
                  <div
                    key={order._id}
                    className="overflow-hidden border border-gray-200 bg-white"
                  >

                    {/* Header */}
                    <div className="flex flex-col justify-between gap-4 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center">

                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-400">
                          Order
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          #{order._id}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">

                        {order.createdAt && (
                          <span className="text-sm text-gray-500">
                            {new Date(
                              order.createdAt
                            ).toLocaleDateString(
                              'en-IN',
                              {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              }
                            )}
                          </span>
                        )}

                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-medium ${getStatusClasses(
                            order.orderStatus
                          )}`}
                        >
                          {order.orderStatus}
                        </span>

                      </div>

                    </div>

                    {/* Products */}
                    <div className="px-6 py-5">

                      {order.items?.map(
                        (
                          item,
                          index
                        ) => {
                          const itemTotal =
                            Number(
                              item.price ||
                                0
                            ) *
                            Number(
                              item.quantity ||
                                0
                            );

                          return (
                            <div
                              key={`${item.product || item.name}-${index}`}
                              className="flex gap-4 border-b border-gray-100 py-5 first:pt-0 last:border-b-0 last:pb-0"
                            >

                              {/* Image */}
                              <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">

                                {item.image ? (
                                  <img
                                    src={getImageUrl(
                                      item.image
                                    )}
                                    alt={
                                      item.name
                                    }
                                    className="h-full w-full object-cover"
                                    onError={(
                                      event
                                    ) => {
                                      event.currentTarget.style.display =
                                        'none';
                                    }}
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <Package
                                      size={22}
                                      className="text-gray-300"
                                    />
                                  </div>
                                )}

                              </div>

                              {/* Details */}
                              <div className="min-w-0 flex-1">

                                <p className="text-sm font-medium">
                                  {item.name}
                                </p>

                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">

                                  <span>
                                    Qty:{' '}
                                    {
                                      item.quantity
                                    }
                                  </span>

                                  {item.size && (
                                    <span>
                                      Size:{' '}
                                      {
                                        item.size
                                      }
                                    </span>
                                  )}

                                  {item.color && (
                                    <span>
                                      Color:{' '}
                                      {
                                        item.color
                                      }
                                    </span>
                                  )}

                                </div>

                                <p className="mt-3 text-sm font-medium">
                                  ₹
                                  {itemTotal.toLocaleString(
                                    'en-IN'
                                  )}
                                </p>

                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 bg-gray-50 px-6 py-6">

                      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">

                        {/* Address */}
                        {order.shippingAddress ? (
                          <div>

                            <div className="flex items-center gap-2">
                              <MapPin
                                size={16}
                                className="text-gray-500"
                              />

                              <p className="text-sm font-medium">
                                Delivery Address
                              </p>
                            </div>

                            <div className="mt-3 text-sm leading-6 text-gray-600">

                              {order.shippingAddress
                                .name && (
                                <p className="font-medium text-gray-800">
                                  {
                                    order
                                      .shippingAddress
                                      .name
                                  }
                                </p>
                              )}

                              {order.shippingAddress
                                .phone && (
                                <p>
                                  {
                                    order
                                      .shippingAddress
                                      .phone
                                  }
                                </p>
                              )}

                              {order.shippingAddress
                                .address && (
                                <p>
                                  {
                                    order
                                      .shippingAddress
                                      .address
                                  }
                                </p>
                              )}

                              <p>
                                {
                                  order
                                    .shippingAddress
                                    .city
                                }

                                {order
                                  .shippingAddress
                                  .city &&
                                  order
                                    .shippingAddress
                                    .state
                                  ? ', '
                                  : ''}

                                {
                                  order
                                    .shippingAddress
                                    .state
                                }
                              </p>

                              {order.shippingAddress
                                .pincode && (
                                <p>
                                  PIN:{' '}
                                  {
                                    order
                                      .shippingAddress
                                      .pincode
                                  }
                                </p>
                              )}

                            </div>

                          </div>
                        ) : (
                          <div />
                        )}

                        {/* Order totals */}
                        <div className="min-w-[220px]">

                          <div className="flex justify-between gap-8 text-sm">
                            <span className="text-gray-500">
                              Items
                            </span>

                            <span>
                              {itemCount}{' '}
                              {itemCount ===
                              1
                                ? 'item'
                                : 'items'}
                            </span>
                          </div>

                          <div className="mt-2 flex justify-between gap-8 text-sm">
                            <span className="text-gray-500">
                              Payment
                            </span>

                            <span>
                              {
                                order.paymentMethod
                              }
                            </span>
                          </div>

                          <div className="mt-2 flex justify-between gap-8 text-sm">
                            <span className="text-gray-500">
                              Shipping
                            </span>

                            <span>
                              {Number(
                                order.shippingCharge ||
                                  0
                              ) === 0
                                ? 'Free'
                                : `₹${Number(
                                    order.shippingCharge ||
                                      0
                                  ).toLocaleString(
                                    'en-IN'
                                  )}`}
                            </span>
                          </div>

                          <div className="mt-4 flex justify-between gap-8 border-t pt-4">
                            <span className="font-medium">
                              Total
                            </span>

                            <span className="text-xl font-medium">
                              ₹
                              {orderTotal.toLocaleString(
                                'en-IN'
                              )}
                            </span>
                          </div>

                        </div>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

    </section>
  );
};

export default Orders;
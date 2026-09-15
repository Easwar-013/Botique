import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  MapPin,
  Package,
  RefreshCw,
  Search,
} from 'lucide-react';

import api from '../../services/api';

interface OrderUser {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface OrderItem {
  product?: string;
  name: string;
  image?: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

interface ShippingAddress {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface Order {
  _id: string;
  orderNumber?: string;

  user?: string | OrderUser;

  items?: OrderItem[];

  subtotal: number;
  shippingCharge: number;
  discount: number;
  totalAmount: number;

  couponCode?: string;

  paymentMethod: string;
  paymentStatus: string;

  orderStatus: string;

  shippingAddress?: ShippingAddress;

  createdAt: string;
  updatedAt?: string;
}

const statusOptions = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Returned',
];

const paymentOptions = [
  'Pending',
  'Paid',
];

const getOrderStatusClasses = (
  status: string
): string => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';

    case 'Confirmed':
      return 'bg-purple-50 text-purple-700 border-purple-200';

    case 'Processing':
      return 'bg-orange-50 text-orange-700 border-orange-200';

    case 'Shipped':
      return 'bg-blue-50 text-blue-700 border-blue-200';

    case 'Out for Delivery':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';

    case 'Delivered':
      return 'bg-green-50 text-green-700 border-green-200';

    case 'Cancelled':
      return 'bg-red-50 text-red-700 border-red-200';

    case 'Returned':
      return 'bg-gray-100 text-gray-700 border-gray-200';

    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getPaymentStatusClasses = (
  status: string
): string => {
  if (status === 'Paid') {
    return 'bg-green-50 text-green-700 border-green-200';
  }

  return 'bg-amber-50 text-amber-700 border-amber-200';
};

const Orders: React.FC = () => {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState('');

  const [error, setError] =
    useState('');

  /*
   * Load orders
   */
  const loadOrders = async (
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
        await api.get('/orders');

      const orderList =
        response.data?.orders;

      setOrders(
        Array.isArray(orderList)
          ? orderList
          : []
      );
    } catch (requestError: any) {
      console.error(
        'Load orders error:',
        requestError
      );

      setError(
        requestError?.response
          ?.data?.message ||
          'Failed to load orders.'
      );

      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  /*
   * Search + status
   */
  const filteredOrders =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return orders.filter(
        (order) => {
          const customer =
            typeof order.user ===
            'object'
              ? order.user
              : undefined;

          const customerName =
            customer?.name || '';

          const customerEmail =
            customer?.email || '';

          const orderNumber =
            order.orderNumber ||
            order._id ||
            '';

          const matchesSearch =
            !query ||
            orderNumber
              .toLowerCase()
              .includes(query) ||
            order._id
              .toLowerCase()
              .includes(query) ||
            customerName
              .toLowerCase()
              .includes(query) ||
            customerEmail
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            !status ||
            order.orderStatus ===
              status;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      orders,
      search,
      status,
    ]);

  /*
   * Update order status
   */
  const updateOrderStatus =
    async (
      orderId: string,
      newStatus: string
    ) => {
      try {
        setError('');

        const response =
          await api.put(
            `/orders/${orderId}/status`,
            {
              status:
                newStatus,
            }
          );

        const updatedOrder =
          response.data?.order;

        setOrders(
          (previous) =>
            previous.map(
              (order) =>
                order._id ===
                orderId
                  ? {
                      ...order,
                      orderStatus:
                        updatedOrder?.orderStatus ||
                        newStatus,
                    }
                  : order
            )
        );
      } catch (requestError: any) {
        console.error(
          'Update order status error:',
          requestError
        );

        await loadOrders();

        alert(
          requestError?.response
            ?.data?.message ||
            'Failed to update order status.'
        );
      }
    };

  /*
   * Update payment status
   */
  const updatePaymentStatus =
    async (
      orderId: string,
      newPaymentStatus:
        | 'Pending'
        | 'Paid'
    ) => {
      try {
        setError('');

        const response =
          await api.put(
            `/orders/${orderId}/payment-status`,
            {
              paymentStatus:
                newPaymentStatus,
            }
          );

        const updatedOrder =
          response.data?.order;

        setOrders(
          (previous) =>
            previous.map(
              (order) =>
                order._id ===
                orderId
                  ? {
                      ...order,
                      paymentStatus:
                        updatedOrder?.paymentStatus ||
                        newPaymentStatus,
                    }
                  : order
            )
        );
      } catch (requestError: any) {
        console.error(
          'Update payment status error:',
          requestError
        );

        await loadOrders();

        alert(
          requestError?.response
            ?.data?.message ||
            'Failed to update payment status.'
        );
      }
    };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

        <div>
          <p className="text-sm text-gray-500">
            Sales
          </p>

          <h1 className="mt-1 text-3xl font-semibold text-gray-900">
            Orders
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {orders.length}{' '}
            {orders.length === 1
              ? 'order'
              : 'orders'}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadOrders(true)
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

      {/* Main */}
      <div className="mt-7 overflow-hidden rounded-2xl border border-gray-200 bg-white">

        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:flex-wrap sm:p-5">

          <div className="relative min-w-0 flex-1 sm:max-w-lg">
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
              placeholder="Search order number or customer"
              className="w-full rounded-xl border border-gray-200 px-11 py-3 text-sm outline-none transition focus:border-black"
            />
          </div>

          <select
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value
              )
            }
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-black sm:w-auto"
          >
            <option value="">
              All Order Statuses
            </option>

            {statusOptions.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">
            Loading orders...
          </div>
        ) : filteredOrders.length ===
          0 ? (
          <div className="p-12 text-center sm:p-14">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Package
                size={24}
                className="text-gray-400"
              />
            </div>

            <p className="mt-4 text-base font-medium text-gray-900">
              {search || status
                ? 'No matching orders'
                : 'No orders found'}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {orders.length === 0
                ? 'Customer orders will appear here.'
                : 'Try changing your search or status filter.'}
            </p>
          </div>
        ) : (
          /*
           * IMPORTANT:
           * Mobile -> horizontal scrolling
           * Tablet/Desktop -> table fits the container
           */
          <div className="w-full overflow-x-auto">

            <table className="w-full min-w-[1080px] text-left md:min-w-0 md:table-fixed">

              {/* Explicit desktop widths */}
              <colgroup>
                <col className="w-[10%]" />
                <col className="w-[14%]" />
                <col className="w-[6%]" />
                <col className="w-[9%]" />
                <col className="w-[15%]" />
                <col className="w-[27%]" />
                <col className="w-[19%]" />
              </colgroup>

              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>

                  <th className="px-3 py-4 text-xs font-semibold text-gray-700 lg:px-4">
                    Order
                  </th>

                  <th className="px-3 py-4 text-xs font-semibold text-gray-700 lg:px-4">
                    Customer
                  </th>

                  <th className="px-2 py-4 text-center text-xs font-semibold text-gray-700">
                    Items
                  </th>

                  <th className="px-3 py-4 text-xs font-semibold text-gray-700 lg:px-4">
                    Total
                  </th>

                  <th className="px-3 py-4 text-xs font-semibold text-gray-700 lg:px-4">
                    Payment
                  </th>

                  <th className="px-3 py-4 text-xs font-semibold text-gray-700 lg:px-4">
                    Delivery
                  </th>

                  <th className="px-3 py-4 text-xs font-semibold text-gray-700 lg:px-4">
                    Order Status
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredOrders.map(
                  (order) => {
                    const customer =
                      typeof order.user ===
                      'object'
                        ? order.user
                        : undefined;

                    const customerName =
                      customer?.name ||
                      'Customer';

                    const customerEmail =
                      customer?.email ||
                      '';

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

                    const displayOrderNumber =
                      order.orderNumber ||
                      `#${order._id
                        .slice(-8)
                        .toUpperCase()}`;

                    const paymentStatus =
                      order.paymentStatus ===
                      'Paid'
                        ? 'Paid'
                        : 'Pending';

                    return (
                      <tr
                        key={
                          order._id
                        }
                        className="border-b border-gray-100 last:border-0"
                      >

                        {/* Order */}
                        <td className="px-3 py-5 align-top lg:px-4">

                          <p className="break-all text-sm font-medium text-gray-900">
                            {
                              displayOrderNumber
                            }
                          </p>

                          <p className="mt-1 text-[11px] text-gray-400">
                            {new Date(
                              order.createdAt
                            ).toLocaleDateString(
                              'en-IN',
                              {
                                day: '2-digit',
                                month:
                                  'short',
                                year:
                                  'numeric',
                              }
                            )}
                          </p>

                        </td>

                        {/* Customer */}
                        <td className="px-3 py-5 align-top lg:px-4">

                          <p className="break-words text-sm font-medium text-gray-900">
                            {
                              customerName
                            }
                          </p>

                          <p className="mt-1 break-all text-[11px] leading-4 text-gray-400">
                            {
                              customerEmail
                            }
                          </p>

                        </td>

                        {/* Items */}
                        <td className="px-2 py-5 text-center align-top text-sm">
                          {itemCount}
                        </td>

                        {/* Total */}
                        <td className="px-3 py-5 align-top text-sm font-medium lg:px-4">
                          ₹
                          {Number(
                            order.totalAmount ||
                              0
                          ).toLocaleString(
                            'en-IN'
                          )}
                        </td>

                        {/* Payment */}
                        <td className="px-3 py-5 align-top lg:px-4">

                          <div className="w-full">

                            <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                              {order.paymentMethod ===
                              'ONLINE'
                                ? 'Online Payment'
                                : 'Cash on Delivery'}
                            </p>

                            <div
                              className={`rounded-xl border p-2 ${
                                paymentStatus ===
                                'Paid'
                                  ? 'border-green-200 bg-green-50'
                                  : 'border-amber-200 bg-amber-50'
                              }`}
                            >

                              <select
                                value={
                                  paymentStatus
                                }
                                onChange={(
                                  e
                                ) =>
                                  updatePaymentStatus(
                                    order._id,
                                    e.target
                                      .value as
                                      | 'Pending'
                                      | 'Paid'
                                  )
                                }
                                className={`w-full rounded-lg border bg-white px-2.5 py-2 text-xs font-medium outline-none ${
                                  paymentStatus ===
                                  'Paid'
                                    ? 'border-green-200 text-green-700'
                                    : 'border-amber-200 text-amber-700'
                                }`}
                              >
                                {paymentOptions.map(
                                  (
                                    option
                                  ) => (
                                    <option
                                      key={
                                        option
                                      }
                                      value={
                                        option
                                      }
                                    >
                                      {
                                        option
                                      }
                                    </option>
                                  )
                                )}
                              </select>

                              <p
                                className={`mt-1 px-1 text-[10px] leading-4 ${
                                  paymentStatus ===
                                  'Paid'
                                    ? 'text-green-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {paymentStatus ===
                                'Paid'
                                  ? 'Payment received'
                                  : order.paymentMethod ===
                                      'COD'
                                    ? 'Awaiting cash payment'
                                    : 'Awaiting online payment'}
                              </p>

                            </div>
                          </div>

                        </td>

                        {/* Delivery */}
                        <td className="px-3 py-5 align-top lg:px-4">

                          {order.shippingAddress ? (
                            <div className="flex items-start gap-2">

                              <MapPin
                                size={14}
                                className="mt-0.5 shrink-0 text-gray-400"
                              />

                              <div className="min-w-0 text-[11px] leading-4 text-gray-600">

                                <p className="break-words font-medium text-gray-800">
                                  {
                                    order
                                      .shippingAddress
                                      .name
                                  }
                                </p>

                                {order
                                  .shippingAddress
                                  .phone && (
                                  <p className="break-all">
                                    {
                                      order
                                        .shippingAddress
                                        .phone
                                    }
                                  </p>
                                )}

                                <p className="break-words">
                                  {
                                    order
                                      .shippingAddress
                                      .address
                                  }
                                </p>

                                <p className="break-words">
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

                                <p>
                                  PIN:{' '}
                                  {
                                    order
                                      .shippingAddress
                                      .pincode
                                  }
                                </p>

                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">
                              -
                            </span>
                          )}

                        </td>

                        {/* Order status */}
                        <td className="px-3 py-5 align-top lg:px-4">

                          <div className="w-full">

                            <span
                              className={`mb-2 inline-flex max-w-full rounded-full border px-2.5 py-1 text-[10px] font-medium ${getOrderStatusClasses(
                                order.orderStatus
                              )}`}
                            >
                              {
                                order.orderStatus
                              }
                            </span>

                            <select
                              value={
                                order.orderStatus
                              }
                              onChange={(
                                e
                              ) =>
                                updateOrderStatus(
                                  order._id,
                                  e.target
                                    .value
                                )
                              }
                              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs outline-none focus:border-black"
                            >
                              {statusOptions.map(
                                (
                                  item
                                ) => (
                                  <option
                                    key={
                                      item
                                    }
                                    value={
                                      item
                                    }
                                  >
                                    {
                                      item
                                    }
                                  </option>
                                )
                              )}
                            </select>

                          </div>

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

export default Orders;
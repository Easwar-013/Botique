import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  IndianRupee,
  Package,
  Plus,
  ShoppingBag,
  Truck,
  Users,
  XCircle,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import api from '../../services/api';

interface Stats {
  revenue?: number;
  orders?: number;
  customers?: number;
  products?: number;
}

interface OrderItem {
  product?: string;
  productId?: string;
  name?: string;
  quantity?: number;
  price?: number;
  total?: number;
}

interface Order {
  _id?: string;
  id?: string;
  orderNumber?: string;
  user?: {
    name?: string;
    email?: string;
  };
  customer?: {
    name?: string;
    email?: string;
  };
  items?: OrderItem[];
  totalAmount?: number;
  total?: number;
  orderStatus?: string;
  paymentStatus?: string;
  createdAt?: string;
}

interface Product {
  _id?: string;
  id?: string;
  name?: string;
  stock?: number;
}

interface StatusConfig {
  label: string;
  icon: React.ElementType;
  className: string;
  iconClassName: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] =
    useState<Stats>({});

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loadingOrders, setLoadingOrders] =
    useState(true);

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  /*
   * =====================================================
   * LOAD DASHBOARD DATA
   * =====================================================
   */

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [
          analyticsResponse,
          ordersResponse,
          productsResponse,
        ] = await Promise.all([
          api.get('/analytics'),
          api.get('/orders'),
          api.get('/products', {
            params: {
              limit: 1000,
            },
          }),
        ]);

        /*
         * Analytics
         */
        setStats(
          analyticsResponse.data?.stats ||
            analyticsResponse.data ||
            {}
        );

        /*
         * Orders
         */
        const orderData =
          ordersResponse.data;

        setOrders(
          Array.isArray(
            orderData?.orders
          )
            ? orderData.orders
            : Array.isArray(orderData)
              ? orderData
              : []
        );

        /*
         * Products
         */
        const productData =
          productsResponse.data;

        setProducts(
          Array.isArray(
            productData?.products
          )
            ? productData.products
            : Array.isArray(productData)
              ? productData
              : []
        );
      } catch (error) {
        console.error(
          'Failed to load dashboard:',
          error
        );
      } finally {
        setLoadingOrders(false);
        setLoadingProducts(false);
      }
    };

    loadDashboard();
  }, []);

  /*
   * =====================================================
   * TOP STAT CARDS
   * =====================================================
   */

  const cards = [
    {
      title: 'Revenue',
      value: `₹${(
        stats.revenue || 0
      ).toLocaleString('en-IN')}`,
      icon: IndianRupee,
    },
    {
      title: 'Orders',
      value: stats.orders || 0,
      icon: ShoppingBag,
    },
    {
      title: 'Customers',
      value: stats.customers || 0,
      icon: Users,
    },
    {
      title: 'Products',
      value: stats.products || 0,
      icon: Package,
    },
  ];

  /*
   * =====================================================
   * ORDER STATUS OVERVIEW
   * =====================================================
   */

  const statusConfigs: Record<
    string,
    StatusConfig
  > = {
    Pending: {
      label: 'Pending',
      icon: Clock3,
      className:
        'border-amber-200 bg-amber-50 hover:bg-amber-100',
      iconClassName:
        'text-amber-600',
    },

    Confirmed: {
      label: 'Confirmed',
      icon: CheckCircle2,
      className:
        'border-blue-200 bg-blue-50 hover:bg-blue-100',
      iconClassName:
        'text-blue-600',
    },

    Processing: {
      label: 'Processing',
      icon: Package,
      className:
        'border-purple-200 bg-purple-50 hover:bg-purple-100',
      iconClassName:
        'text-purple-600',
    },

    Shipped: {
      label: 'Shipped',
      icon: Truck,
      className:
        'border-indigo-200 bg-indigo-50 hover:bg-indigo-100',
      iconClassName:
        'text-indigo-600',
    },

    'Out for Delivery': {
      label: 'Out for Delivery',
      icon: Truck,
      className:
        'border-orange-200 bg-orange-50 hover:bg-orange-100',
      iconClassName:
        'text-orange-600',
    },

    Delivered: {
      label: 'Delivered',
      icon: CheckCircle2,
      className:
        'border-green-200 bg-green-50 hover:bg-green-100',
      iconClassName:
        'text-green-600',
    },

    Cancelled: {
      label: 'Cancelled',
      icon: XCircle,
      className:
        'border-red-200 bg-red-50 hover:bg-red-100',
      iconClassName:
        'text-red-600',
    },
  };

  const orderStatusCounts =
    useMemo(() => {
      const counts: Record<
        string,
        number
      > = {};

      Object.keys(
        statusConfigs
      ).forEach((status) => {
        counts[status] = 0;
      });

      orders.forEach((order) => {
        const status =
          order.orderStatus ||
          'Pending';

        if (
          Object.prototype.hasOwnProperty.call(
            counts,
            status
          )
        ) {
          counts[status] += 1;
        }
      });

      return counts;
    }, [orders]);

  /*
   * =====================================================
   * RECENT ORDERS
   * =====================================================
   */

  const recentOrders =
    useMemo(() => {
      return [...orders]
        .sort((a, b) => {
          const dateA =
            new Date(
              a.createdAt || 0
            ).getTime();

          const dateB =
            new Date(
              b.createdAt || 0
            ).getTime();

          return dateB - dateA;
        })
        .slice(0, 5);
    }, [orders]);

  /*
   * =====================================================
   * TOP SELLING PRODUCTS
   * =====================================================
   */

  const topSellingProducts =
    useMemo(() => {
      const salesMap: Record<
        string,
        {
          name: string;
          quantity: number;
        }
      > = {};

      orders.forEach((order) => {
        /*
         * Do not count cancelled orders
         * as sales.
         */
        if (
          order.orderStatus ===
          'Cancelled'
        ) {
          return;
        }

        (order.items || []).forEach(
          (item) => {
            const productKey =
              item.product ||
              item.productId ||
              item.name ||
              '';

            if (!productKey) {
              return;
            }

            const quantity =
              Number(
                item.quantity
              ) || 0;

            const productName =
              item.name ||
              'Unknown Product';

            if (
              !salesMap[
                productKey
              ]
            ) {
              salesMap[
                productKey
              ] = {
                name: productName,
                quantity: 0,
              };
            }

            salesMap[
              productKey
            ].quantity += quantity;
          }
        );
      });

      return Object.values(
        salesMap
      )
        .sort(
          (a, b) =>
            b.quantity -
            a.quantity
        )
        .slice(0, 4);
    }, [orders]);

  /*
   * =====================================================
   * LOW STOCK
   * =====================================================
   */

  const lowStockProducts =
    useMemo(() => {
      return products
        .filter(
          (product) =>
            Number(product.stock) <= 5
        )
        .sort(
          (a, b) =>
            Number(a.stock || 0) -
            Number(b.stock || 0)
        )
        .slice(0, 4);
    }, [products]);

  /*
   * =====================================================
   * HELPERS
   * =====================================================
   */

  const getOrderCustomerName = (
    order: Order
  ) => {
    return (
      order.user?.name ||
      order.customer?.name ||
      'Customer'
    );
  };

  const getOrderAmount = (
    order: Order
  ) => {
    return Number(
      order.totalAmount ??
        order.total ??
        0
    );
  };

  const getStatusClasses = (
    status: string
  ) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-700';

      case 'Shipped':
        return 'bg-indigo-100 text-indigo-700';

      case 'Out for Delivery':
        return 'bg-orange-100 text-orange-700';

      case 'Processing':
        return 'bg-purple-100 text-purple-700';

      case 'Confirmed':
        return 'bg-blue-100 text-blue-700';

      case 'Cancelled':
        return 'bg-red-100 text-red-700';

      default:
        return 'bg-amber-100 text-amber-700';
    }
  };

  const getStockStatus = (
    stock: number
  ) => {
    if (stock <= 2) {
      return {
        label: 'Critical',
        className:
          'bg-red-100 text-red-700',
      };
    }

    if (stock <= 5) {
      return {
        label: 'Low',
        className:
          'bg-amber-100 text-amber-700',
      };
    }

    return {
      label: 'Normal',
      className:
        'bg-green-100 text-green-700',
    };
  };

  const formatOrderNumber = (
    order: Order
  ) => {
    if (order.orderNumber) {
      return order.orderNumber;
    }

    const id =
      order._id ||
      order.id ||
      '';

    return id
      ? `#${id.slice(-6).toUpperCase()}`
      : '#ORDER';
  };

  /*
   * =====================================================
   * QUICK ACTIONS
   * =====================================================
   */

  const quickActions = [
    {
      label: 'Add Product',
      icon: Plus,
      onClick: () =>
        navigate(
          '/admin/products/create'
        ),
    },

    {
      label: 'Create Coupon',
      icon: Plus,
      onClick: () =>
        navigate(
          '/admin/coupons'
        ),
    },

    {
      label: 'View Orders',
      icon: ShoppingBag,
      onClick: () =>
        navigate(
          '/admin/orders'
        ),
    },

    {
      label: 'View Customers',
      icon: Users,
      onClick: () =>
        navigate(
          '/admin/customers'
        ),
    },
  ];

  /*
   * =====================================================
   * RETURN
   * =====================================================
   */

  return (
    <div className="p-6 lg:p-8">
      {/* =================================================
          HEADER
      ================================================= */}

      <div>
        <p className="text-sm text-gray-500">
          Admin Dashboard
        </p>

        <h1 className="mt-1 text-3xl font-semibold">
          Overview
        </h1>
      </div>

      {/* =================================================
          STAT CARDS
      ================================================= */}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {card.title}
                </span>

                <Icon
                  size={20}
                  className="text-gray-400"
                />
              </div>

              <p className="mt-4 text-3xl font-semibold">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* =================================================
          QUICK ACTIONS
      ================================================= */}

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage your boutique faster.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(
            (action) => {
              const Icon =
                action.icon;

              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={
                    action.onClick
                  }
                  className="group flex items-center justify-between rounded-xl border border-gray-200 px-4 py-4 text-left transition hover:border-black hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition group-hover:bg-black group-hover:text-white">
                      <Icon
                        size={18}
                      />
                    </span>

                    <span className="text-sm font-medium">
                      {action.label}
                    </span>
                  </div>

                  <ArrowRight
                    size={16}
                    className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-black"
                  />
                </button>
              );
            }
          )}
        </div>
      </section>

      {/* =================================================
          ORDER STATUS + RECENT ORDERS
      ================================================= */}

      <div className="mt-8 grid gap-6 xl:grid-cols-[360px_1fr]">

        {/* Order Status Overview */}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold">
              Order Status
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Current order distribution.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {Object.entries(
              statusConfigs
            ).map(
              ([
                status,
                config,
              ]) => {
                const Icon =
                  config.icon;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      navigate(
                        `/admin/orders?status=${encodeURIComponent(
                          status
                        )}`
                      )
                    }
                    className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition ${config.className}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={18}
                        className={
                          config.iconClassName
                        }
                      />

                      <span className="text-sm font-medium text-gray-800">
                        {config.label}
                      </span>
                    </div>

                    <span className="text-lg font-semibold text-gray-900">
                      {
                        orderStatusCounts[
                          status
                        ]
                      }
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </section>

        {/* Recent Orders */}

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold">
                Recent Orders
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Latest customer orders.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/admin/orders'
                )
              }
              className="flex items-center gap-1 text-sm font-medium text-gray-700 transition hover:text-black"
            >
              View All
              <ArrowRight size={15} />
            </button>
          </div>

          {loadingOrders ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Loading orders...
            </div>
          ) : recentOrders.length ===
            0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No orders found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Order
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Customer
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Amount
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentOrders.map(
                    (order) => {
                      const status =
                        order.orderStatus ||
                        'Pending';

                      return (
                        <tr
                          key={
                            order._id ||
                            order.id ||
                            formatOrderNumber(
                              order
                            )
                          }
                          className="border-b border-gray-100 last:border-0"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {formatOrderNumber(
                              order
                            )}
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-600">
                            {getOrderCustomerName(
                              order
                            )}
                          </td>

                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            ₹
                            {getOrderAmount(
                              order
                            ).toLocaleString(
                              'en-IN'
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* =================================================
          TOP SELLING + LOW STOCK
      ================================================= */}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">

        {/* Top Selling Products */}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Top Selling Products
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Products with the highest units sold.
              </p>
            </div>

            <Package
              size={20}
              className="text-gray-400"
            />
          </div>

          {loadingOrders ? (
            <div className="mt-8 text-center text-sm text-gray-500">
              Loading sales...
            </div>
          ) : topSellingProducts.length ===
            0 ? (
            <div className="mt-8 text-center text-sm text-gray-500">
              No sales data available.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {topSellingProducts.map(
                (
                  product,
                  index
                ) => (
                  <div
                    key={`${product.name}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-xs font-medium text-white">
                        {index + 1}
                      </span>

                      <p className="truncate text-sm font-medium text-gray-800">
                        {product.name}
                      </p>
                    </div>

                    <span className="ml-4 shrink-0 text-sm font-semibold text-gray-900">
                      {product.quantity}{' '}
                      sold
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* Low Stock Alert */}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Low Stock Alert
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Products that need attention.
              </p>
            </div>

            <AlertTriangle
              size={20}
              className="text-amber-500"
            />
          </div>

          {loadingProducts ? (
            <div className="mt-8 text-center text-sm text-gray-500">
              Loading inventory...
            </div>
          ) : lowStockProducts.length ===
            0 ? (
            <div className="mt-8 rounded-xl bg-green-50 px-4 py-5 text-center text-sm text-green-700">
              All products have healthy stock levels.
            </div>
          ) : (
            <>
              <div className="mt-5 space-y-3">
                {lowStockProducts.map(
                  (
                    product
                  ) => {
                    const stock =
                      Number(
                        product.stock
                      ) || 0;

                    const stockStatus =
                      getStockStatus(
                        stock
                      );

                    return (
                      <div
                        key={
                          product._id ||
                          product.id ||
                          product.name
                        }
                        className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-800">
                            {product.name ||
                              'Unnamed Product'}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {stock}{' '}
                            left
                          </p>
                        </div>

                        <span
                          className={`ml-4 shrink-0 rounded-full px-3 py-1 text-xs font-medium ${stockStatus.className}`}
                        >
                          {
                            stockStatus.label
                          }
                        </span>
                      </div>
                    );
                  }
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/admin/products'
                  )
                }
                className="mt-5 flex items-center gap-1 text-sm font-medium text-gray-700 transition hover:text-black"
              >
                View Inventory
                <ArrowRight
                  size={15}
                />
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
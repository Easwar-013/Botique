import React, {
  useEffect,
  useState,
} from 'react';

import {
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  MapPin,
  ShoppingBag,
} from 'lucide-react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import api from '../../services/api';

import {
  useCart,
} from '../../context/CartContext';

import {
  useAuth,
} from '../../context/AuthContext';

import {
  getImageUrl,
} from '../../utils/imageUrl';

interface ShippingForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface PinCodePostOffice {
  Name: string;
  District: string;
  State: string;
  Division?: string;
  Block?: string;
}

interface PinCodeResponse {
  Status: string;
  Message?: string;
  PostOffice: PinCodePostOffice[] | null;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();

  const {
    cart,
    subtotal,
    clearCart,
  } = useCart();

  const {
    user,
    isAuthenticated,
  } = useAuth();

  const [placingOrder, setPlacingOrder] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState(false);

  const [orderId, setOrderId] =
    useState('');

  const [paymentMethod, setPaymentMethod] =
    useState<'cod' | 'online'>('cod');

  const [pincodeLoading, setPincodeLoading] =
    useState(false);

  const [pincodeMessage, setPincodeMessage] =
    useState('');

  const [form, setForm] =
    useState<ShippingForm>({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    });

  /*
   * Require login.
   */
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', {
        replace: true,
      });
    }
  }, [isAuthenticated, navigate]);

  /*
   * Keep logged-in user's information.
   */
  useEffect(() => {
    if (!user) {
      return;
    }

    setForm((current) => ({
      ...current,
      name: current.name || user.name || '',
      email: current.email || user.email || '',
      phone: current.phone || user.phone || '',
    }));
  }, [user]);

  /*
   * PIN code lookup.
   */
  useEffect(() => {
    const pincode = form.pincode.trim();

    if (pincode.length !== 6) {
      setPincodeMessage('');
      return;
    }

    let cancelled = false;

    const lookupPincode = async () => {
      try {
        setPincodeLoading(true);
        setPincodeMessage('');

        const response = await fetch(
          `https://api.postalpincode.in/pincode/${pincode}`
        );

        if (!response.ok) {
          throw new Error(
            'PIN lookup failed'
          );
        }

        const data =
          (await response.json()) as PinCodeResponse[];

        if (cancelled) {
          return;
        }

        const result = data?.[0];

        if (
          result?.Status === 'Success' &&
          result.PostOffice &&
          result.PostOffice.length > 0
        ) {
          const firstPostOffice =
            result.PostOffice[0];

          setForm((current) => ({
            ...current,
            city:
              firstPostOffice.District ||
              firstPostOffice.Name ||
              current.city,
            state:
              firstPostOffice.State ||
              current.state,
          }));

          setPincodeMessage(
            `${firstPostOffice.District}, ${firstPostOffice.State}`
          );
        } else {
          setPincodeMessage(
            'PIN code not found.'
          );

          setForm((current) => ({
            ...current,
            city: '',
            state: '',
          }));
        }
      } catch (lookupError) {
        if (!cancelled) {
          console.error(
            'PIN lookup error:',
            lookupError
          );

          setPincodeMessage(
            'Unable to fetch PIN details.'
          );
        }
      } finally {
        if (!cancelled) {
          setPincodeLoading(false);
        }
      }
    };

    lookupPincode();

    return () => {
      cancelled = true;
    };
  }, [form.pincode]);

  if (!isAuthenticated) {
    return null;
  }

  /*
   * Empty cart.
   */
  if (cart.length === 0 && !success) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <ShoppingBag
              size={28}
              className="text-gray-500"
            />
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-gray-400">
            BOUTIQUE
          </p>

          <h1 className="mt-3 text-3xl font-light">
            Your Cart is Empty
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            Add products to your cart before
            proceeding to checkout.
          </p>

          <Link
            to="/shop"
            className="mt-7 inline-flex rounded-full bg-black px-7 py-3 text-sm text-white transition hover:bg-gray-800"
          >
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  /*
   * Always convert money values to numbers.
   */
  const safeSubtotal = Number(subtotal) || 0;

  const shipping: number =
    safeSubtotal >= 999 ? 0 : 49;

  const total: number =
    safeSubtotal + shipping;

  /*
   * Update form.
   */
  const updateField = (
    field: keyof ShippingForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError('');
  };

  /*
   * Validate.
   */
  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      setError(
        'Please enter your full name.'
      );
      return false;
    }

    if (!form.email.trim()) {
      setError(
        'Please enter your email.'
      );
      return false;
    }

    if (!form.phone.trim()) {
      setError(
        'Please enter your phone number.'
      );
      return false;
    }

    if (!form.address.trim()) {
      setError(
        'Please enter your delivery address.'
      );
      return false;
    }

    if (!form.city.trim()) {
      setError(
        'Please enter your city.'
      );
      return false;
    }

    if (!form.state.trim()) {
      setError(
        'Please enter your state.'
      );
      return false;
    }

    if (
      !/^\d{6}$/.test(
        form.pincode.trim()
      )
    ) {
      setError(
        'Please enter a valid 6-digit PIN code.'
      );
      return false;
    }

    return true;
  };

  /*
   * Place order.
   */
  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return;
    }

    if (paymentMethod === 'online') {
      setError(
        'Online payment is not connected yet. Please select Cash on Delivery.'
      );
      return;
    }

    try {
      setPlacingOrder(true);
      setError('');

      /*
       * Recalculate the cart subtotal
       * directly from the cart.
       *
       * This prevents any stale/invalid
       * subtotal value from reaching
       * the backend.
       */
      const calculatedSubtotal = Number(
        cart.reduce(
          (sum, item) => {
            const itemPrice = Number(
              item.product.discountPrice ??
                item.product.price
            );

            return (
              sum +
              itemPrice * item.quantity
            );
          },
          0
        ).toFixed(2)
      );

      const calculatedShipping: number =
        calculatedSubtotal >= 999
          ? 0
          : 49;

      const calculatedTotal: number =
        Number(
          (
            calculatedSubtotal +
            calculatedShipping
          ).toFixed(2)
        );

      /*
       * Make sure values are valid.
       */
      if (
        !Number.isFinite(
          calculatedSubtotal
        ) ||
        !Number.isFinite(
          calculatedTotal
        )
      ) {
        setError(
          'Unable to calculate the order total.'
        );
        return;
      }

      const orderItems =
        cart.map((item) => {
          const price = Number(
            item.product.discountPrice ??
              item.product.price
          );

          const itemTotal = Number(
            (
              price * item.quantity
            ).toFixed(2)
          );

          return {
            product: item.product._id,
            productId: item.product._id,
            name: item.product.name,
            quantity: item.quantity,
            size: item.size,
            color:
              item.color || undefined,
            price,
            total: itemTotal,
          };
        });

      const shippingAddress = {
        name: form.name.trim(),

        email: form.email
          .trim()
          .toLowerCase(),

        phone: form.phone.trim(),

        address:
          form.address.trim(),

        city: form.city.trim(),

        state: form.state.trim(),

        pincode:
          form.pincode.trim(),
      };

      /*
       * Send both `total` and `totalAmount`
       * for compatibility with the current
       * order backend.
       */
      const orderPayload = {
        items: orderItems,

        shippingAddress,

        paymentMethod,

        subtotal:
          calculatedSubtotal,

        shipping:
          calculatedShipping,

        total:
          calculatedTotal,

        totalAmount:
          calculatedTotal,

        shippingAmount:
          calculatedShipping,
      };

      console.log(
        'Order payload:',
        orderPayload
      );

      const response =
        await api.post(
          '/orders',
          orderPayload
        );

      const createdOrder =
        response.data?.order;

      setOrderId(
        createdOrder?._id ||
          createdOrder?.id ||
          ''
      );

      clearCart();

      setSuccess(true);
    } catch (requestError: any) {
      console.error(
        'Place order error:',
        requestError
      );

      console.error(
        'Backend response:',
        requestError?.response?.data
      );

      setError(
        requestError?.response?.data
          ?.message ||
          'Unable to place your order. Please try again.'
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  /*
   * Success.
   */
  if (success) {
    return (
      <section className="flex min-h-[75vh] items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-black text-white">
            <Check size={34} />
          </div>

          <p className="mt-7 text-xs uppercase tracking-[0.3em] text-gray-400">
            BOUTIQUE
          </p>

          <h1 className="mt-3 text-4xl font-light">
            Order Confirmed
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-gray-500">
            Thank you for shopping with
            BOUTIQUE. Your order has been
            placed successfully.
          </p>

          {orderId && (
            <div className="mt-6 rounded-xl bg-gray-50 px-5 py-4">
              <p className="text-xs uppercase tracking-wider text-gray-400">
                Order ID
              </p>

              <p className="mt-1 text-sm font-medium">
                {orderId}
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/orders"
              className="rounded-full bg-black px-7 py-3 text-sm text-white transition hover:bg-gray-800"
            >
              View Orders
            </Link>

            <Link
              to="/shop"
              className="rounded-full border border-gray-300 px-7 py-3 text-sm transition hover:border-black"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
      <div className="mb-10">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-black"
        >
          <ArrowLeft size={16} />
          Back to Cart
        </Link>

        <p className="mt-8 text-xs uppercase tracking-[0.3em] text-gray-400">
          BOUTIQUE
        </p>

        <h1 className="mt-3 text-4xl font-light sm:text-5xl">
          Checkout
        </h1>

        <p className="mt-3 text-sm text-gray-500">
          Complete your delivery details and
          place your order.
        </p>
      </div>

      {error && (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        {/* Left */}
        <div className="space-y-8">
          {/* Delivery */}
          <div className="border border-gray-200 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <MapPin size={19} />
              </div>

              <div>
                <h2 className="text-lg font-medium">
                  Delivery Information
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Enter the address where your
                  order should be delivered.
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Full Name
                </label>

                <input
                  value={form.name}
                  onChange={(e) =>
                    updateField(
                      'name',
                      e.target.value
                    )
                  }
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Email
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    updateField(
                      'email',
                      e.target.value
                    )
                  }
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Phone
                </label>

                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    updateField(
                      'phone',
                      e.target.value
                    )
                  }
                  placeholder="Enter your phone"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  PIN Code
                </label>

                <div className="relative">
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    value={form.pincode}
                    onChange={(e) =>
                      updateField(
                        'pincode',
                        e.target.value.replace(
                          /\D/g,
                          ''
                        )
                      )
                    }
                    placeholder="6-digit PIN"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-11 text-sm outline-none transition focus:border-black"
                  />

                  {pincodeLoading && (
                    <Loader2
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-gray-400"
                    />
                  )}
                </div>

                {pincodeMessage && (
                  <p
                    className={`mt-2 text-xs ${
                      pincodeMessage.includes(
                        'not found'
                      ) ||
                      pincodeMessage.includes(
                        'Unable'
                      )
                        ? 'text-red-500'
                        : 'text-green-600'
                    }`}
                  >
                    {pincodeMessage}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  Address
                </label>

                <textarea
                  rows={4}
                  value={form.address}
                  onChange={(e) =>
                    updateField(
                      'address',
                      e.target.value
                    )
                  }
                  placeholder="House / Flat / Street / Area"
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  City
                </label>

                <input
                  value={form.city}
                  onChange={(e) =>
                    updateField(
                      'city',
                      e.target.value
                    )
                  }
                  placeholder="City"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                />

                <p className="mt-1 text-[11px] text-gray-400">
                  Filled automatically from the
                  PIN code. You can edit it.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  State
                </label>

                <input
                  value={form.state}
                  onChange={(e) =>
                    updateField(
                      'state',
                      e.target.value
                    )
                  }
                  placeholder="State"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                />

                <p className="mt-1 text-[11px] text-gray-400">
                  Filled automatically from the
                  PIN code. You can edit it.
                </p>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="border border-gray-200 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <CreditCard size={19} />
              </div>

              <div>
                <h2 className="text-lg font-medium">
                  Payment Method
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Choose how you'd like to pay.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() =>
                  setPaymentMethod('cod')
                }
                className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                  paymentMethod === 'cod'
                    ? 'border-black'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <div>
                  <p className="text-sm font-medium">
                    Cash on Delivery
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Pay when your order arrives.
                  </p>
                </div>

                <div
                  className={`h-5 w-5 rounded-full border ${
                    paymentMethod === 'cod'
                      ? 'border-black bg-black'
                      : 'border-gray-300'
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  setPaymentMethod('online')
                }
                className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                  paymentMethod === 'online'
                    ? 'border-black'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <div>
                  <p className="text-sm font-medium">
                    Online Payment
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Payment gateway will be connected
                    here.
                  </p>
                </div>

                <div
                  className={`h-5 w-5 rounded-full border ${
                    paymentMethod === 'online'
                      ? 'border-black bg-black'
                      : 'border-gray-300'
                  }`}
                />
              </button>
            </div>

            {paymentMethod === 'online' && (
              <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
                Online payment is not connected yet.
                Select Cash on Delivery to place the
                order now.
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="h-fit border border-gray-200 p-6 lg:sticky lg:top-28">
          <h2 className="text-lg font-medium">
            Order Summary
          </h2>

          <div className="mt-6 space-y-5">
            {cart.map((item) => {
              const price = Number(
                item.product.discountPrice ??
                  item.product.price
              );

              const image =
                item.product.images?.[0]?.url;

              return (
                <div
                  key={`${item.product._id}-${item.size}-${item.color ?? ''}`}
                  className="flex gap-4"
                >
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {image ? (
                      <img
                        src={getImageUrl(image)}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-gray-400">
                        No image
                      </div>
                    )}

                    <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[9px] text-white">
                      {item.quantity}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">
                      {item.product.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Size: {item.size}
                    </p>

                    {item.color && (
                      <p className="text-xs text-gray-500">
                        Color: {item.color}
                      </p>
                    )}
                  </div>

                  <p className="shrink-0 text-sm font-medium">
                    ₹
                    {(
                      price * item.quantity
                    ).toLocaleString('en-IN')}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-7 space-y-4 border-t pt-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Subtotal
              </span>

              <span>
                ₹
                {safeSubtotal.toLocaleString(
                  'en-IN'
                )}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Shipping
              </span>

              <span>
                {shipping === 0
                  ? 'Free'
                  : `₹${shipping.toLocaleString(
                      'en-IN'
                    )}`}
              </span>
            </div>

            <div className="flex justify-between border-t pt-5">
              <span className="font-medium">
                Total
              </span>

              <span className="text-xl font-medium">
                ₹
                {total.toLocaleString(
                  'en-IN'
                )}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={
              placingOrder ||
              paymentMethod === 'online'
            }
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-black py-4 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {placingOrder
              ? 'Placing Order...'
              : paymentMethod === 'online'
                ? 'Online Payment Unavailable'
                : 'Place Order'}
          </button>

          <p className="mt-4 text-center text-xs leading-5 text-gray-400">
            By placing your order, you agree to
            BOUTIQUE's terms and conditions.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Checkout;
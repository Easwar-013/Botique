import React from 'react';

import {
  ArrowRight,
  Minus,
  Plus,
  Trash2,
} from 'lucide-react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import { useCart } from '../../context/CartContext';

import { useAuth } from '../../context/AuthContext';

import { getImageUrl } from '../../utils/imageUrl';

const Cart: React.FC = () => {
  const navigate = useNavigate();

  const {
    cart,
    subtotal,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const {
    isAuthenticated,
  } = useAuth();

  /*
   * Empty cart
   */
  if (cart.length === 0) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
            BOUTIQUE
          </p>

          <h1 className="mt-4 text-4xl font-light">
            Your Cart is Empty
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            Discover something you love.
          </p>

          <Link
            to="/shop"
            className="mt-7 inline-block rounded-full bg-black px-7 py-3 text-sm text-white transition hover:bg-gray-800"
          >
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  /*
   * Prevent checkout when logged out.
   *
   * Normally CartContext already blocks
   * unauthenticated users, but this adds
   * another safety layer.
   */
  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    navigate('/checkout');
  };

  return (
    <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
          Shopping Bag
        </p>

        <h1 className="mt-3 text-4xl font-light">
          Your Cart
        </h1>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_380px]">

        {/* ===================================================== */}
        {/* CART ITEMS */}
        {/* ===================================================== */}

        <div className="space-y-6">
          {cart.map((item) => {
            const price =
              item.product.discountPrice ??
              item.product.price;

            const image =
              item.product.images?.[0]?.url;

            return (
              <div
                key={`${item.product._id}-${item.size}-${item.color ?? ''}`}
                className="flex gap-5 border-b border-gray-100 pb-6"
              >
                {/* Product Image */}
                <Link
                  to={`/products/${item.product._id}`}
                  className="h-32 w-24 shrink-0 overflow-hidden bg-gray-100 sm:h-40 sm:w-32"
                >
                  {image ? (
                    <img
                      src={getImageUrl(image)}
                      alt={item.product.name}
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.style.display =
                          'none';
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                      No image
                    </div>
                  )}
                </Link>

                {/* Product Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-4">

                    <div>
                      <Link
                        to={`/products/${item.product._id}`}
                      >
                        <h2 className="font-medium transition hover:text-gray-600">
                          {item.product.name}
                        </h2>
                      </Link>

                      <p className="mt-2 text-sm text-gray-500">
                        Size: {item.size}
                      </p>

                      {item.color && (
                        <p className="text-sm text-gray-500">
                          Color: {item.color}
                        </p>
                      )}
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() =>
                        removeFromCart(
                          item.product._id,
                          item.size,
                          item.color
                        )
                      }
                      className="shrink-0 text-gray-400 transition hover:text-red-500"
                      aria-label={`Remove ${item.product.name}`}
                    >
                      <Trash2 size={18} />
                    </button>

                  </div>

                  {/* Quantity + Price */}
                  <div className="mt-6 flex items-center justify-between">

                    {/* Quantity */}
                    <div className="flex items-center rounded-full border border-gray-200">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.product._id,
                            item.size,
                            item.quantity - 1,
                            item.color
                          )
                        }
                        disabled={
                          item.product.stock <= 0
                        }
                        className="p-2.5 transition hover:text-gray-500 disabled:opacity-30"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>

                      <span className="w-8 text-center text-sm">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.product._id,
                            item.size,
                            item.quantity + 1,
                            item.color
                          )
                        }
                        disabled={
                          item.product.stock <=
                            0 ||
                          item.quantity >=
                            item.product.stock
                        }
                        className="p-2.5 transition hover:text-gray-500 disabled:opacity-30"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Product Total */}
                    <p className="font-medium">
                      ₹
                      {(
                        price * item.quantity
                      ).toLocaleString('en-IN')}
                    </p>

                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ===================================================== */}
        {/* ORDER SUMMARY */}
        {/* ===================================================== */}

        <div className="h-fit border border-gray-200 p-6">
          <h2 className="text-lg font-medium">
            Order Summary
          </h2>

          <div className="mt-6 space-y-4 text-sm">

            {/* Subtotal */}
            <div className="flex justify-between">
              <span className="text-gray-500">
                Subtotal
              </span>

              <span>
                ₹
                {subtotal.toLocaleString(
                  'en-IN'
                )}
              </span>
            </div>

            {/* Shipping */}
            <div className="flex justify-between">
              <span className="text-gray-500">
                Shipping
              </span>

              <span>
                {subtotal >= 999
                  ? 'Free'
                  : 'Calculated at checkout'}
              </span>
            </div>

          </div>

          {/* Total */}
          <div className="mt-6 border-t pt-6">
            <div className="flex justify-between">
              <span className="font-medium">
                Total
              </span>

              <span className="text-xl font-medium">
                ₹
                {subtotal.toLocaleString(
                  'en-IN'
                )}
              </span>
            </div>
          </div>

          {/* Checkout */}
          <button
            type="button"
            onClick={handleCheckout}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-black py-4 text-sm text-white transition hover:bg-gray-800"
          >
            Checkout
            <ArrowRight size={17} />
          </button>

        </div>
      </div>
    </section>
  );
};

export default Cart;
import React from 'react';

import {
  motion,
  AnimatePresence,
} from 'framer-motion';

import {
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useCart,
} from '../../context/CartContext';

import {
  useAuth,
} from '../../context/AuthContext';

import {
  getImageUrl,
} from '../../utils/imageUrl';

export const CartDrawer: React.FC =
  () => {
    const {
      cart,
      isCartDrawerOpen,
      setCartDrawerOpen,
      updateQuantity,
      removeFromCart,
      subtotal,
    } = useCart();

    const {
      isAuthenticated,
    } = useAuth();

    const navigate =
      useNavigate();

    const handleCheckout =
      () => {
        setCartDrawerOpen(false);

        if (!isAuthenticated) {
          navigate('/login');
          return;
        }

        navigate('/checkout');
      };

    const handleViewCart =
      () => {
        setCartDrawerOpen(false);

        if (!isAuthenticated) {
          navigate('/login');
          return;
        }

        navigate('/cart');
      };

    return (
      <AnimatePresence>
        {isCartDrawerOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={() =>
                setCartDrawerOpen(
                  false
                )
              }
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.aside
              initial={{
                x: '100%',
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: '100%',
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            >

              {/* Header */}
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Your Cart
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {cart.length ===
                    0
                      ? 'Your cart is empty'
                      : `${
                          cart.length
                        } ${
                          cart.length ===
                          1
                            ? 'item'
                            : 'items'
                        }`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCartDrawerOpen(
                      false
                    )
                  }
                  className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Close cart"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {cart.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                      <span className="text-3xl">
                        🛍️
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900">
                      Your cart is empty
                    </h3>

                    <p className="mt-2 max-w-xs text-sm text-gray-500">
                      Looks like you
                      haven't added
                      anything to your
                      cart yet.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setCartDrawerOpen(
                          false
                        );

                        navigate(
                          '/shop'
                        );
                      }}
                      className="mt-6 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
                    >
                      Continue
                      Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">

                    {cart.map(
                      (item) => {
                        const price =
                          item.product
                            .discountPrice ??
                          item.product
                            .price;

                        return (
                          <motion.div
                            key={`${item.product._id}-${item.size}-${item.color ?? ''}`}
                            layout
                            className="flex gap-4 border-b pb-4"
                          >

                            {/* Image */}
                            <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                              {item
                                .product
                                .images?.[0] ? (
                                <img
                                  src={getImageUrl(
                                    item
                                      .product
                                      .images[0]
                                      .url
                                  )}
                                  alt={
                                    item
                                      .product
                                      .name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                  No Image
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="truncate text-sm font-medium text-gray-900">
                                    {
                                      item
                                        .product
                                        .name
                                    }
                                  </h3>

                                  <p className="mt-1 text-xs text-gray-500">
                                    Size:{' '}
                                    {
                                      item.size
                                    }
                                  </p>

                                  {item.color && (
                                    <p className="text-xs text-gray-500">
                                      Color:{' '}
                                      {
                                        item.color
                                      }
                                    </p>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeFromCart(
                                      item
                                        .product
                                        ._id,
                                      item.size,
                                      item.color
                                    )
                                  }
                                  className="rounded p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                                  aria-label="Remove item"
                                >
                                  <Trash2
                                    size={
                                      16
                                    }
                                  />
                                </button>
                              </div>

                              {/* Price */}
                              <div className="mt-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  ₹
                                  {price.toLocaleString(
                                    'en-IN'
                                  )}
                                </span>

                                {item
                                  .product
                                  .discountPrice &&
                                  item
                                    .product
                                    .discountPrice <
                                    item
                                      .product
                                      .price && (
                                    <span className="ml-2 text-xs text-gray-400 line-through">
                                      ₹
                                      {item.product.price.toLocaleString(
                                        'en-IN'
                                      )}
                                    </span>
                                  )}
                              </div>

                              {/* Quantity */}
                              <div className="mt-3 flex items-center justify-between">
                                <div className="flex items-center rounded-full border">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuantity(
                                        item
                                          .product
                                          ._id,
                                        item.size,
                                        item.quantity -
                                          1,
                                        item.color
                                      )
                                    }
                                    className="p-2 text-gray-600 transition hover:text-black"
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus
                                      size={
                                        14
                                      }
                                    />
                                  </button>

                                  <span className="min-w-8 text-center text-sm font-medium">
                                    {
                                      item.quantity
                                    }
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuantity(
                                        item
                                          .product
                                          ._id,
                                        item.size,
                                        item.quantity +
                                          1,
                                        item.color
                                      )
                                    }
                                    disabled={
                                      item.quantity >=
                                      item
                                        .product
                                        .stock
                                    }
                                    className="p-2 text-gray-600 transition hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
                                    aria-label="Increase quantity"
                                  >
                                    <Plus
                                      size={
                                        14
                                      }
                                    />
                                  </button>
                                </div>

                                <span className="text-sm font-semibold">
                                  ₹
                                  {(
                                    price *
                                    item.quantity
                                  ).toLocaleString(
                                    'en-IN'
                                  )}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      }
                    )}

                  </div>
                )}
              </div>

              {/* Footer */}
              {cart.length >
                0 && (
                <div className="border-t bg-white px-5 py-5">

                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Subtotal
                    </span>

                    <span className="text-lg font-semibold text-gray-900">
                      ₹
                      {subtotal.toLocaleString(
                        'en-IN'
                      )}
                    </span>
                  </div>

                  <p className="mb-4 text-xs text-gray-500">
                    Taxes and shipping charges
                    are calculated at checkout.
                  </p>

                  <button
                    type="button"
                    onClick={
                      handleCheckout
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3.5 text-sm font-medium text-white transition hover:bg-gray-800"
                  >
                    Checkout
                    <ArrowRight
                      size={17}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleViewCart
                    }
                    className="mt-3 w-full rounded-full border border-gray-300 px-6 py-3.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
                  >
                    View Cart
                  </button>

                </div>
              )}

            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  };
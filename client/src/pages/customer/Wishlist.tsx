import React from 'react';
import { Heart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  motion,
} from 'framer-motion';

import {
  useWishlist,
} from '../../context/WishlistContext';

import {
  useCart,
} from '../../context/CartContext';

const Wishlist: React.FC = () => {
  const {
    wishlist,
    removeFromWishlist,
    clearWishlist,
  } = useWishlist();

  const { addToCart } = useCart();

  const moveToCart = (
    product: (typeof wishlist)[number]
  ) => {
    addToCart(
      product,
      product.sizes[0] || 'Standard',
      product.colors[0],
      1
    );

    removeFromWishlist(product._id);
  };

  return (
    <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
      <div className="flex items-end justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
            Saved Pieces
          </p>

          <h1 className="mt-3 text-4xl font-light">
            Wishlist
          </h1>
        </div>

        {wishlist.length > 0 && (
          <button
            type="button"
            onClick={clearWishlist}
            className="text-sm text-gray-500 underline"
          >
            Clear all
          </button>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <Heart
            size={38}
            className="text-gray-300"
          />

          <h2 className="mt-5 text-2xl font-light">
            Your wishlist is empty
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Save pieces you love and come back
            to them later.
          </p>

          <Link
            to="/shop"
            className="mt-7 rounded-full bg-black px-7 py-3 text-sm text-white"
          >
            Explore Collection
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {wishlist.map((product) => {
            const price =
              product.discountPrice ??
              product.price;

            const image =
              product.images?.[0]?.url;

            return (
              <motion.div
                key={product._id}
                layout
              >
                <Link
                  to={`/products/${product._id}`}
                  className="group block"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-gray-100">
                    {image && (
                      <img
                        src={image}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    )}
                  </div>

                  <h3 className="mt-4 text-sm font-medium">
                    {product.name}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    ₹
                    {price.toLocaleString(
                      'en-IN'
                    )}
                  </p>
                </Link>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      moveToCart(product)
                    }
                    className="flex-1 rounded-full bg-black py-2.5 text-xs text-white"
                  >
                    Move to Cart
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      removeFromWishlist(
                        product._id
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200"
                    aria-label="Remove"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default Wishlist;
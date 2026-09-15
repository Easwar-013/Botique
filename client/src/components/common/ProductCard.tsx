import React, { useState } from 'react';

import { Heart } from 'lucide-react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import { motion } from 'framer-motion';

import type { Product } from '../../types';

import { useWishlist } from '../../context/WishlistContext';

import { useAuth } from '../../context/AuthContext';

import { getImageUrl } from '../../utils/imageUrl';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
}) => {
  const navigate = useNavigate();

  const [isHovered, setIsHovered] =
    useState(false);

  const {
    isInWishlist,
    toggleWishlist,
  } = useWishlist();

  const { isAuthenticated } = useAuth();

  const liked = isInWishlist(
    product._id
  );

  const price =
    product.discountPrice ??
    product.price;

  const hasDiscount =
    product.discountPrice !==
      undefined &&
    product.discountPrice <
      product.price;

  const discountPercentage =
    hasDiscount
      ? Math.round(
          ((product.price -
            price) /
            product.price) *
            100
        )
      : 0;

  const primaryImage =
    product.images?.find(
      (image) =>
        image.isPrimary
    )?.url ||
    product.images?.[0]?.url;

  const handleWishlist = (
    event: React.MouseEvent
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    toggleWishlist(product);
  };

  return (
    <motion.article
      layout
      initial={{
        opacity: 0,
        y: 20,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.15,
      }}
      transition={{
        duration: 0.5,
      }}
      className="group"
    >
      {/* ================================================= */}
      {/* PRODUCT IMAGE */}
      {/* ================================================= */}
      <div
        className="relative aspect-[4/5] overflow-hidden bg-gray-100"
        onMouseEnter={() =>
          setIsHovered(true)
        }
        onMouseLeave={() =>
          setIsHovered(false)
        }
      >
        <Link
          to={`/products/${product._id}`}
          className="block h-full w-full"
        >
          {primaryImage ? (
            <img
              src={getImageUrl(
                primaryImage
              )}
              alt={product.name}
              className="
                h-full
                w-full
                object-cover
                transition-transform
                duration-700
                ease-out
              "
              style={{
                transform:
                  isHovered
                    ? 'scale(1.05)'
                    : 'scale(1)',
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              No image
            </div>
          )}
        </Link>

        {/* ================================================= */}
        {/* BADGES */}
        {/* ================================================= */}
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">

          {product.isNewArrival && (
            <span className="bg-white px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-black shadow-sm">
              New
            </span>
          )}

          {hasDiscount && (
            <span className="bg-black px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
              -{discountPercentage}%
            </span>
          )}

        </div>

        {/* ================================================= */}
        {/* WISHLIST BUTTON */}
        {/* ================================================= */}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={
            liked
              ? 'Remove from wishlist'
              : 'Add to wishlist'
          }
          className="
            absolute
            right-3
            top-3
            z-20
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            bg-white/95
            shadow-md
            backdrop-blur-sm
            transition-all
            duration-300
            ease-out
            hover:bg-white
            hover:shadow-lg
            active:scale-90
          "
          style={{
            opacity:
              typeof window !==
                'undefined' &&
              window.innerWidth < 768
                ? 1
                : isHovered
                ? 1
                : 0,
            transform:
              typeof window !==
                'undefined' &&
              window.innerWidth < 768
                ? 'translateY(0) scale(1)'
                : isHovered
                ? 'translateY(0) scale(1)'
                : 'translateY(-8px) scale(0.85)',
            pointerEvents:
              typeof window !==
                'undefined' &&
              window.innerWidth < 768
                ? 'auto'
                : isHovered
                ? 'auto'
                : 'none',
          }}
        >
          <Heart
            size={18}
            strokeWidth={1.8}
            className={`
              transition-all
              duration-300
              ${
                liked
                  ? 'fill-black text-black'
                  : 'text-gray-700'
              }
            `}
          />
        </button>
      </div>

      {/* ================================================= */}
      {/* PRODUCT INFORMATION */}
      {/* ================================================= */}
      <Link
        to={`/products/${product._id}`}
        className="block"
      >
        <div className="mt-4">

          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
            {product.brand ||
              'HangOver'}
          </p>

          <h3 className="mt-1 line-clamp-1 text-sm font-medium transition-colors duration-300 group-hover:text-gray-600">
            {product.name}
          </h3>

          <div className="mt-2 flex items-center gap-2">

            <span className="text-sm font-medium">
              ₹
              {price.toLocaleString(
                'en-IN'
              )}
            </span>

            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                ₹
                {product.price.toLocaleString(
                  'en-IN'
                )}
              </span>
            )}

          </div>

        </div>
      </Link>
    </motion.article>
  );
};

export default ProductCard;
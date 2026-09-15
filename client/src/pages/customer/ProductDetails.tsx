import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Check,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  UserRound,
} from 'lucide-react';

import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { motion } from 'framer-motion';

import api from '../../services/api';

import type {
  Product,
} from '../../types';

import {
  useCart,
} from '../../context/CartContext';

import {
  useWishlist,
} from '../../context/WishlistContext';

import {
  useAuth,
} from '../../context/AuthContext';

import {
  getImageUrl,
} from '../../utils/imageUrl';

/*
 * --------------------------------------------------
 * Helpers
 * --------------------------------------------------
 */

const getColorHex = (
  color: string
): string => {
  const normalized =
    color
      .trim()
      .toLowerCase();

  const colors: Record<
    string,
    string
  > = {
    black: '#000000',
    white: '#ffffff',
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
    yellow: '#eab308',
    orange: '#f97316',
    pink: '#ec4899',
    purple: '#a855f7',
    brown: '#92400e',
    grey: '#6b7280',
    gray: '#6b7280',
    beige: '#d6c2a1',
    cream: '#fffdd0',
    navy: '#1e3a8a',
    maroon: '#800000',
    silver: '#c0c0c0',
    gold: '#d4af37',
  };

  return (
    colors[normalized] ??
    '#d1d5db'
  );
};

interface Review {
  _id: string;

  rating: number;

  comment: string;

  createdAt?: string;

  user?: {
    _id?: string;
    name?: string;
    avatar?: string;
  };

  customer?: {
    _id?: string;
    name?: string;
    avatar?: string;
  };

  name?: string;

  userName?: string;

  userAvatar?: string;
}

const REVIEW_STORAGE_KEY =
  'hangover-recently-viewed';

const MAX_RECENT_PRODUCTS = 6;

/*
 * Safely read recently viewed products.
 */
const getRecentlyViewed =
  (): Product[] => {
    try {
      const raw =
        localStorage.getItem(
          REVIEW_STORAGE_KEY
        );

      if (!raw) {
        return [];
      }

      const parsed =
        JSON.parse(raw);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      return [];
    }
  };

/*
 * Save recently viewed products.
 */
const saveRecentlyViewed =
  (
    products: Product[]
  ) => {
    try {
      localStorage.setItem(
        REVIEW_STORAGE_KEY,
        JSON.stringify(
          products
        )
      );
    } catch (error) {
      console.error(
        'Failed to save recently viewed products:',
        error
      );
    }
  };

/*
 * --------------------------------------------------
 * Product card
 * --------------------------------------------------
 */

interface RelatedProductCardProps {
  item: Product;
}

const RelatedProductCard: React.FC<
  RelatedProductCardProps
> = ({
  item,
}) => {
  const itemPrice =
    item.discountPrice ??
    item.price;

  const hasDiscount =
    item.discountPrice !==
      undefined &&
    item.discountPrice <
      item.price;

  const image =
    item.images?.[0]?.url ||
    '';

  return (
    <Link
      to={`/products/${item._id}`}
      className="group block"
    >
      <div className="overflow-hidden bg-gray-100">

        {image ? (
          <img
            src={getImageUrl(image)}
            alt={item.name}
            className="aspect-[4/5] h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex aspect-[4/5] items-center justify-center text-sm text-gray-400">
            No image
          </div>
        )}

      </div>

      <div className="pt-4">

        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
          {item.brand ||
            item.category ||
            'HangOver'}
        </p>

        <h3 className="mt-2 line-clamp-1 text-sm font-medium text-gray-900">
          {item.name}
        </h3>

        <div className="mt-2 flex items-center gap-2">

          <span className="text-sm font-medium">
            ₹
            {itemPrice.toLocaleString(
              'en-IN'
            )}
          </span>

          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              ₹
              {item.price.toLocaleString(
                'en-IN'
              )}
            </span>
          )}

        </div>

      </div>
    </Link>
  );
};

/*
 * --------------------------------------------------
 * Stars
 * --------------------------------------------------
 */

interface StarRatingProps {
  rating: number;
  interactive?: boolean;
  onChange?: (
    rating: number
  ) => void;
  size?: number;
}

const StarRating: React.FC<
  StarRatingProps
> = ({
  rating,
  interactive = false,
  onChange,
  size = 18,
}) => {
  return (
    <div className="flex items-center gap-1">

      {[1, 2, 3, 4, 5].map(
        (star) => {
          const filled =
            star <= rating;

          if (interactive) {
            return (
              <button
                key={star}
                type="button"
                onClick={() =>
                  onChange?.(
                    star
                  )
                }
                className="transition-transform hover:scale-110"
                aria-label={`Rate ${star} star${
                  star > 1
                    ? 's'
                    : ''
                }`}
              >
                <Star
                  size={size}
                  className={
                    filled
                      ? 'fill-black text-black'
                      : 'text-gray-300'
                  }
                />
              </button>
            );
          }

          return (
            <Star
              key={star}
              size={size}
              className={
                filled
                  ? 'fill-black text-black'
                  : 'text-gray-300'
              }
            />
          );
        }
      )}

    </div>
  );
};

/*
 * --------------------------------------------------
 * Product Details
 * --------------------------------------------------
 */

const ProductDetails: React.FC =
  () => {
    const { id } =
      useParams();

    const navigate =
      useNavigate();

    const {
      addToCart,
    } = useCart();

    const {
      isInWishlist,
      toggleWishlist,
    } = useWishlist();

    const {
      user,
      isAuthenticated,
    } = useAuth();

    const [
      product,
      setProduct,
    ] = useState<Product | null>(
      null
    );

    const [
      loading,
      setLoading,
    ] = useState(true);

    const [
      selectedImage,
      setSelectedImage,
    ] = useState(0);

    const [
      selectedSize,
      setSelectedSize,
    ] = useState('');

    const [
      selectedColor,
      setSelectedColor,
    ] = useState('');

    const [
      quantity,
      setQuantity,
    ] = useState(1);

    /*
     * Similar products
     */
    const [
      recommendations,
      setRecommendations,
    ] = useState<Product[]>(
      []
    );

    const [
      recommendationsLoading,
      setRecommendationsLoading,
    ] = useState(false);

    /*
     * Recently viewed
     */
    const [
      recentlyViewed,
      setRecentlyViewed,
    ] = useState<Product[]>(
      []
    );

    /*
     * Reviews
     */
    const [
      reviews,
      setReviews,
    ] = useState<Review[]>(
      []
    );

    const [
      reviewsLoading,
      setReviewsLoading,
    ] = useState(false);

    const [
      submittingReview,
      setSubmittingReview,
    ] = useState(false);

    const [
      reviewRating,
      setReviewRating,
    ] = useState(5);

    const [
      reviewComment,
      setReviewComment,
    ] = useState('');

    const [
      reviewError,
      setReviewError,
    ] = useState('');

    /*
     * --------------------------------------------------
     * Load product
     * --------------------------------------------------
     */

    useEffect(() => {
      const loadProduct =
        async () => {
          if (!id) {
            setProduct(null);
            setLoading(false);
            return;
          }

          try {
            setLoading(true);

            const response =
              await api.get(
                `/products/${id}`
              );

            const loadedProduct =
              response.data
                .product as Product;

            setProduct(
              loadedProduct
            );

            if (
              loadedProduct?.sizes
                ?.length > 0
            ) {
              setSelectedSize(
                loadedProduct.sizes[0]
              );
            } else {
              setSelectedSize('');
            }

            if (
              loadedProduct?.colors
                ?.length > 0
            ) {
              setSelectedColor(
                loadedProduct.colors[0]
              );
            } else {
              setSelectedColor('');
            }

            setSelectedImage(0);
            setQuantity(1);
          } catch (error) {
            console.error(
              'Failed to load product:',
              error
            );

            setProduct(null);
          } finally {
            setLoading(false);
          }
        };

      loadProduct();
    }, [id]);

    /*
     * --------------------------------------------------
     * Recently viewed
     * --------------------------------------------------
     */

    useEffect(() => {
      if (!product) {
        return;
      }

      const current =
        getRecentlyViewed();

      const withoutCurrent =
        current.filter(
          (item) =>
            item._id !==
            product._id
        );

      const updated = [
        product,
        ...withoutCurrent,
      ].slice(
        0,
        MAX_RECENT_PRODUCTS
      );

      saveRecentlyViewed(
        updated
      );

      /*
       * Don't show the current product
       * in Recently Viewed.
       */
      setRecentlyViewed(
        updated.filter(
          (item) =>
            item._id !==
            product._id
        )
      );
    }, [product]);

    /*
     * --------------------------------------------------
     * Similar products
     * --------------------------------------------------
     */

    useEffect(() => {
      const loadRecommendations =
        async () => {
          if (!product) {
            return;
          }

          try {
            setRecommendationsLoading(
              true
            );

            const response =
              await api.get(
                '/products',
                {
                  params: {
                    category:
                      product.category,
                    limit: 12,
                    page: 1,
                  },
                }
              );

            const products =
              Array.isArray(
                response.data?.products
              )
                ? response.data
                    .products
                : [];

            const filtered =
              products
                .filter(
                  (
                    item: Product
                  ) =>
                    item._id !==
                    product._id
                )
                .slice(
                  0,
                  8
                );

            setRecommendations(
              filtered
            );
          } catch (error) {
            console.error(
              'Failed to load recommendations:',
              error
            );

            setRecommendations(
              []
            );
          } finally {
            setRecommendationsLoading(
              false
            );
          }
        };

      loadRecommendations();
    }, [product]);

    /*
     * --------------------------------------------------
     * Reviews
     * --------------------------------------------------
     */

    useEffect(() => {
      const loadReviews =
        async () => {
          if (!product) {
            return;
          }

          try {
            setReviewsLoading(
              true
            );

            const response =
              await api.get(
                '/reviews',
                {
                  params: {
                    product:
                      product._id,
                  },
                }
              );

            const reviewList =
              response.data
                ?.reviews ||
              response.data
                ?.data ||
              [];

            setReviews(
              Array.isArray(
                reviewList
              )
                ? reviewList
                : []
            );
          } catch (error) {
            console.error(
              'Failed to load reviews:',
              error
            );

            setReviews([]);
          } finally {
            setReviewsLoading(
              false
            );
          }
        };

      loadReviews();
    }, [product]);

    /*
     * --------------------------------------------------
     * Login guard
     * --------------------------------------------------
     */

    const requireLogin =
      (): boolean => {
        if (
          !isAuthenticated
        ) {
          navigate(
            '/login'
          );

          return false;
        }

        return true;
      };

    /*
     * --------------------------------------------------
     * Wishlist
     * --------------------------------------------------
     */

    const handleWishlist =
      () => {
        if (
          !requireLogin()
        ) {
          return;
        }

        if (!product) {
          return;
        }

        toggleWishlist(
          product
        );
      };

    /*
     * --------------------------------------------------
     * Add to cart
     * --------------------------------------------------
     */

    const handleAddToCart =
      () => {
        if (
          !requireLogin()
        ) {
          return;
        }

        if (!product) {
          return;
        }

        if (
          product.sizes.length >
            0 &&
          !selectedSize
        ) {
          alert(
            'Please select a size.'
          );

          return;
        }

        if (
          product.stock <=
          0
        ) {
          return;
        }

        const added =
          addToCart(
            product,
            selectedSize ||
              'Standard',
            selectedColor ||
              undefined,
            quantity
          );

        if (!added) {
          navigate(
            '/login'
          );
        }
      };

    /*
     * --------------------------------------------------
     * Buy now
     * --------------------------------------------------
     */

    const handleBuyNow =
      () => {
        if (
          !requireLogin()
        ) {
          return;
        }

        if (!product) {
          return;
        }

        if (
          product.sizes.length >
            0 &&
          !selectedSize
        ) {
          alert(
            'Please select a size.'
          );

          return;
        }

        if (
          product.stock <=
          0
        ) {
          return;
        }

        const added =
          addToCart(
            product,
            selectedSize ||
              'Standard',
            selectedColor ||
              undefined,
            quantity
          );

        if (!added) {
          navigate(
            '/login'
          );

          return;
        }

        navigate(
          '/checkout'
        );
      };

    /*
     * --------------------------------------------------
     * Submit review
     * --------------------------------------------------
     */

    const handleSubmitReview =
      async () => {
        if (
          !requireLogin()
        ) {
          return;
        }

        if (!product) {
          return;
        }

        const comment =
          reviewComment.trim();

        if (!comment) {
          setReviewError(
            'Please write a review.'
          );

          return;
        }

        if (
          comment.length <
          5
        ) {
          setReviewError(
            'Review must contain at least 5 characters.'
          );

          return;
        }

        try {
          setSubmittingReview(
            true
          );

          setReviewError('');

          const response =
            await api.post(
              '/reviews',
              {
                product:
                  product._id,

                productId:
                  product._id,

                rating:
                  reviewRating,

                comment,
              }
            );

          const createdReview =
            response.data
              ?.review;

          if (
            createdReview
          ) {
            setReviews(
              (current) => [
                createdReview,
                ...current,
              ]
            );
          } else {
            /*
             * Reload reviews when
             * backend doesn't return
             * the created review.
             */
            const refreshed =
              await api.get(
                '/reviews',
                {
                  params: {
                    product:
                      product._id,
                  },
                }
              );

            const list =
              refreshed.data
                ?.reviews ||
              refreshed.data
                ?.data ||
              [];

            setReviews(
              Array.isArray(list)
                ? list
                : []
            );
          }

          setReviewComment('');
          setReviewRating(5);
        } catch (error: any) {
          console.error(
            'Submit review error:',
            error
          );

          setReviewError(
            error?.response
              ?.data?.message ||
              'Unable to submit your review.'
          );
        } finally {
          setSubmittingReview(
            false
          );
        }
      };

    /*
     * --------------------------------------------------
     * Review calculations
     * --------------------------------------------------
     */

    const reviewStats =
      useMemo(() => {
        const count =
          reviews.length;

        const average =
          count > 0
            ? reviews.reduce(
                (
                  total,
                  review
                ) =>
                  total +
                  Number(
                    review.rating ||
                      0
                  ),
                0
              ) / count
            : Number(
                (product as any)
                  ?.ratingsAverage ||
                  0
              );

        return {
          count,
          average:
            Number.isFinite(
              average
            )
              ? average
              : 0,
        };
      }, [
        reviews,
        product,
      ]);

    /*
     * --------------------------------------------------
     * Loading
     * --------------------------------------------------
     */

    if (loading) {
      return (
        <div className="mx-auto max-w-7xl px-6 py-20">

          <div className="grid animate-pulse gap-10 lg:grid-cols-2">

            <div className="aspect-[4/5] bg-gray-100" />

            <div className="space-y-5">
              <div className="h-4 w-24 bg-gray-100" />

              <div className="h-10 w-3/4 bg-gray-100" />

              <div className="h-6 w-32 bg-gray-100" />

              <div className="h-24 w-full bg-gray-100" />
            </div>

          </div>
        </div>
      );
    }

    /*
     * --------------------------------------------------
     * Not found
     * --------------------------------------------------
     */

    if (!product) {
      return (
        <div className="flex min-h-[70vh] items-center justify-center px-6">

          <div className="text-center">

            <h1 className="text-3xl font-light">
              Product Not Found
            </h1>

            <Link
              to="/shop"
              className="mt-6 inline-block rounded-full bg-black px-6 py-3 text-sm text-white"
            >
              Back to Shop
            </Link>

          </div>

        </div>
      );
    }

    /*
     * --------------------------------------------------
     * Product values
     * --------------------------------------------------
     */

    const price =
      product.discountPrice ??
      product.price;

    const hasDiscount =
      product.discountPrice !==
        undefined &&
      product.discountPrice <
        product.price;

    const image =
      product.images?.[
        selectedImage
      ]?.url;

    return (
      <div>

        {/* ================================================= */}
        {/* PRODUCT DETAILS */}
        {/* ================================================= */}

        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-16">

          {/* Breadcrumb */}
          <div className="mb-8 text-xs text-gray-400">

            <Link
              to="/"
              className="transition hover:text-black"
            >
              Home
            </Link>

            <span className="mx-2">
              /
            </span>

            <Link
              to="/shop"
              className="transition hover:text-black"
            >
              Shop
            </Link>

            <span className="mx-2">
              /
            </span>

            <span className="text-gray-700">
              {product.name}
            </span>

          </div>

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">

            {/* ================================================= */}
            {/* IMAGES */}
            {/* ================================================= */}

            <div>

              <motion.div
                key={image}
                initial={{
                  opacity: 0.5,
                }}
                animate={{
                  opacity: 1,
                }}
                className="aspect-[4/5] overflow-hidden bg-gray-100"
              >
                {image ? (
                  <img
                    src={getImageUrl(
                      image
                    )}
                    alt={
                      product.name
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    No image
                  </div>
                )}
              </motion.div>

              {product.images
                .length > 1 && (
                <div className="mt-4 grid grid-cols-5 gap-3">

                  {product.images.map(
                    (
                      item,
                      index
                    ) => (
                      <button
                        key={
                          item.publicId ||
                          index
                        }
                        type="button"
                        onClick={() =>
                          setSelectedImage(
                            index
                          )
                        }
                        className={`aspect-square overflow-hidden border ${
                          selectedImage ===
                          index
                            ? 'border-black'
                            : 'border-transparent'
                        }`}
                      >
                        <img
                          src={getImageUrl(
                            item.url
                          )}
                          alt={`${product.name} ${
                            index + 1
                          }`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    )
                  )}

                </div>
              )}

            </div>

            {/* ================================================= */}
            {/* DETAILS */}
            {/* ================================================= */}

            <div className="lg:py-6">

              <div className="flex items-start justify-between gap-5">

                <div>

                  <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                    {product.brand ||
                      'HangOver'}
                  </p>

                  <h1 className="mt-3 text-3xl font-light sm:text-4xl">
                    {product.name}
                  </h1>

                </div>

                <button
                  type="button"
                  onClick={
                    handleWishlist
                  }
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 transition hover:border-black"
                  aria-label={
                    isInWishlist(
                      product._id
                    )
                      ? 'Remove from wishlist'
                      : 'Add to wishlist'
                  }
                >
                  <Heart
                    size={20}
                    className={
                      isInWishlist(
                        product._id
                      )
                        ? 'fill-black text-black'
                        : 'text-gray-700'
                    }
                  />
                </button>

              </div>

              {/* Price */}
              <div className="mt-6 flex items-center gap-3">

                <span className="text-xl font-medium">
                  ₹
                  {price.toLocaleString(
                    'en-IN'
                  )}
                </span>

                {hasDiscount && (
                  <span className="text-sm text-gray-400 line-through">
                    ₹
                    {product.price.toLocaleString(
                      'en-IN'
                    )}
                  </span>
                )}

              </div>

              {/* Rating summary */}
              {(reviewStats.count >
                0 ||
                Number(
                  (product as any)
                    ?.ratingsAverage ||
                    0
                ) > 0) && (
                <div className="mt-4 flex items-center gap-3">

                  <StarRating
                    rating={
                      Math.round(
                        reviewStats.average
                      )
                    }
                    size={16}
                  />

                  <span className="text-sm text-gray-500">
                    {reviewStats.average.toFixed(
                      1
                    )}

                    {' · '}

                    {reviewStats.count ||
                      Number(
                        (product as any)
                          ?.ratingsQuantity ||
                          0
                      )}

                    {' reviews'}
                  </span>

                </div>
              )}

              {/* Stock */}
              <div className="mt-4">

                {product.stock >
                0 ? (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Check
                      size={16}
                    />
                    In stock
                  </div>
                ) : (
                  <p className="text-sm text-red-600">
                    Out of stock
                  </p>
                )}

              </div>

              {/* Description */}
              <div className="mt-8 border-y border-gray-100 py-7">

                <p className="text-sm leading-7 text-gray-600">
                  {product.description ||
                    'No description available.'}
                </p>

              </div>

              {/* Color */}
              {product.colors
                .length > 0 && (
                <div className="mt-7">

                  <div className="flex items-center justify-between">

                    <p className="text-sm font-medium">
                      Color
                    </p>

                    <p className="text-sm text-gray-500">
                      {selectedColor ||
                        'Select color'}
                    </p>

                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">

                    {product.colors.map(
                      (
                        color
                      ) => (
                        <button
                          key={
                            color
                          }
                          type="button"
                          onClick={() =>
                            setSelectedColor(
                              color
                            )
                          }
                          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                            selectedColor ===
                            color
                              ? 'border-black'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <span
                            className="h-4 w-4 rounded-full border border-gray-300"
                            style={{
                              backgroundColor:
                                getColorHex(
                                  color
                                ),
                            }}
                          />

                          {color}
                        </button>
                      )
                    )}

                  </div>
                </div>
              )}

              {/* Size */}
              {product.sizes
                .length > 0 && (
                <div className="mt-7">

                  <div className="flex items-center justify-between">

                    <p className="text-sm font-medium">
                      Size
                    </p>

                    <button
                      type="button"
                      className="text-xs underline"
                    >
                      Size Guide
                    </button>

                  </div>

                  <div className="mt-4 grid grid-cols-5 gap-2">

                    {product.sizes.map(
                      (size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() =>
                            setSelectedSize(
                              size
                            )
                          }
                          className={`rounded-lg border py-3 text-sm transition ${
                            selectedSize ===
                            size
                              ? 'border-black bg-black text-white'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          {size}
                        </button>
                      )
                    )}

                  </div>

                </div>
              )}

              {/* Quantity */}
              <div className="mt-7">

                <p className="mb-3 text-sm font-medium">
                  Quantity
                </p>

                <div className="flex w-fit items-center rounded-full border border-gray-200">

                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(
                        (value) =>
                          Math.max(
                            1,
                            value - 1
                          )
                      )
                    }
                    disabled={
                      product.stock <=
                      0
                    }
                    className="p-3 disabled:opacity-30"
                    aria-label="Decrease quantity"
                  >
                    <Minus
                      size={15}
                    />
                  </button>

                  <span className="w-10 text-center text-sm">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    disabled={
                      product.stock <=
                        0 ||
                      quantity >=
                        product.stock
                    }
                    onClick={() =>
                      setQuantity(
                        (value) =>
                          Math.min(
                            product.stock,
                            value + 1
                          )
                      )
                    }
                    className="p-3 disabled:opacity-30"
                    aria-label="Increase quantity"
                  >
                    <Plus
                      size={15}
                    />
                  </button>

                </div>

              </div>

              {/* Actions */}
              <div className="mt-8 space-y-3">

                <button
                  type="button"
                  disabled={
                    product.stock <=
                    0
                  }
                  onClick={
                    handleAddToCart
                  }
                  className="flex w-full items-center justify-center gap-3 rounded-full bg-black py-4 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <ShoppingBag
                    size={18}
                  />
                  Add to Cart
                </button>

                <button
                  type="button"
                  disabled={
                    product.stock <=
                    0
                  }
                  onClick={
                    handleBuyNow
                  }
                  className="w-full rounded-full border border-black py-4 text-sm font-medium transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Buy Now
                </button>

              </div>

              {/* Product information */}
              <div className="mt-10 space-y-5 border-t border-gray-100 pt-7">

                <div className="flex justify-between gap-5 text-sm">
                  <span className="text-gray-500">
                    SKU
                  </span>

                  <span className="text-right">
                    {product.sku}
                  </span>
                </div>

                <div className="flex justify-between gap-5 text-sm">
                  <span className="text-gray-500">
                    Category
                  </span>

                  <span className="text-right">
                    {product.category}
                  </span>
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* SIMILAR PRODUCTS */}
        {/* ================================================= */}

        <section className="border-t border-gray-100">

          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">

            <div className="flex items-end justify-between gap-5">

              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  You may also like
                </p>

                <h2 className="mt-3 text-3xl font-light">
                  Similar Products
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  More styles from the{' '}
                  {product.category}{' '}
                  collection.
                </p>
              </div>

              <Link
                to={`/shop?category=${encodeURIComponent(
                  product.category
                )}`}
                className="hidden text-sm underline sm:block"
              >
                View all
              </Link>

            </div>

            {recommendationsLoading ? (
              <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">

                {[1, 2, 3, 4].map(
                  (item) => (
                    <div
                      key={item}
                      className="animate-pulse"
                    >
                      <div className="aspect-[4/5] bg-gray-100" />

                      <div className="mt-4 h-3 w-20 bg-gray-100" />

                      <div className="mt-2 h-4 w-32 bg-gray-100" />

                      <div className="mt-2 h-4 w-20 bg-gray-100" />
                    </div>
                  )
                )}

              </div>
            ) : recommendations.length >
              0 ? (
              <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">

                {recommendations.map(
                  (item) => (
                    <motion.div
                      key={item._id}
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
                        duration:
                          0.4,
                      }}
                    >
                      <RelatedProductCard
                        item={
                          item
                        }
                      />
                    </motion.div>
                  )
                )}

              </div>
            ) : (
              <div className="mt-10 border border-gray-100 px-6 py-12 text-center">
                <p className="text-sm text-gray-500">
                  More products will appear here soon.
                </p>
              </div>
            )}

          </div>

        </section>

        {/* ================================================= */}
        {/* RECENTLY VIEWED */}
        {/* ================================================= */}

        {recentlyViewed.length >
          0 && (
          <section className="border-t border-gray-100">

            <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">

              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  Your browsing history
                </p>

                <h2 className="mt-3 text-3xl font-light">
                  Recently Viewed
                </h2>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">

                {recentlyViewed.map(
                  (item) => (
                    <RelatedProductCard
                      key={
                        item._id
                      }
                      item={
                        item
                      }
                    />
                  )
                )}

              </div>

            </div>

          </section>
        )}

        {/* ================================================= */}
        {/* REVIEWS */}
        {/* ================================================= */}

        <section className="border-t border-gray-100">

          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">

            <div className="grid gap-12 lg:grid-cols-[320px_1fr]">

              {/* Review summary */}
              <div>

                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  Customer feedback
                </p>

                <h2 className="mt-3 text-3xl font-light">
                  Reviews
                </h2>

                <div className="mt-7">

                  <div className="text-5xl font-light">
                    {reviewStats.average.toFixed(
                      1
                    )}
                  </div>

                  <div className="mt-3">
                    <StarRating
                      rating={Math.round(
                        reviewStats.average
                      )}
                      size={19}
                    />
                  </div>

                  <p className="mt-3 text-sm text-gray-500">
                    {reviewStats.count >
                    0
                      ? `${reviewStats.count} customer review${
                          reviewStats.count >
                          1
                            ? 's'
                            : ''
                        }`
                      : 'No reviews yet'}
                  </p>

                </div>

                {/* Write review */}
                <div className="mt-10 border border-gray-200 p-6">

                  <h3 className="text-lg font-medium">
                    Write a Review
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    Share your experience with this product.
                  </p>

                  <div className="mt-5">

                    <p className="mb-2 text-sm font-medium">
                      Your rating
                    </p>

                    <StarRating
                      rating={
                        reviewRating
                      }
                      interactive
                      onChange={
                        setReviewRating
                      }
                      size={22}
                    />

                  </div>

                  <textarea
                    value={
                      reviewComment
                    }
                    onChange={(
                      event
                    ) =>
                      setReviewComment(
                        event.target
                          .value
                      )
                    }
                    rows={5}
                    placeholder="Tell other customers about the fit, quality, material, comfort..."
                    className="mt-5 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                    disabled={
                      submittingReview
                    }
                  />

                  {reviewError && (
                    <p className="mt-2 text-xs text-red-600">
                      {
                        reviewError
                      }
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={
                      handleSubmitReview
                    }
                    disabled={
                      submittingReview
                    }
                    className="mt-4 w-full rounded-full bg-black py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submittingReview
                      ? 'Submitting...'
                      : 'Submit Review'}
                  </button>

                  {!isAuthenticated && (
                    <p className="mt-3 text-center text-xs text-gray-400">
                      Please sign in to leave a review.
                    </p>
                  )}

                </div>

              </div>

              {/* Review list */}
              <div>

                {reviewsLoading ? (
                  <div className="space-y-6">

                    {[1, 2, 3].map(
                      (item) => (
                        <div
                          key={item}
                          className="animate-pulse border-b border-gray-100 pb-6"
                        >
                          <div className="h-4 w-32 bg-gray-100" />

                          <div className="mt-3 h-3 w-24 bg-gray-100" />

                          <div className="mt-4 h-10 w-full bg-gray-100" />
                        </div>
                      )
                    )}

                  </div>
                ) : reviews.length >
                  0 ? (
                  <div className="space-y-7">

                    {reviews.map(
                      (
                        review
                      ) => {
                        const reviewerName =
                          review.user
                            ?.name ||
                          review.customer
                            ?.name ||
                          review.name ||
                          review.userName ||
                          'Customer';

                        const reviewerAvatar =
                          review.user
                            ?.avatar ||
                          review.customer
                            ?.avatar ||
                          review.userAvatar ||
                          '';

                        return (
                          <article
                            key={
                              review._id
                            }
                            className="border-b border-gray-100 pb-7 last:border-b-0"
                          >

                            <div className="flex items-start justify-between gap-5">

                              <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">

                                  {reviewerAvatar ? (
                                    <img
                                      src={getImageUrl(
                                        reviewerAvatar
                                      )}
                                      alt={
                                        reviewerName
                                      }
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <UserRound
                                      size={
                                        17
                                      }
                                      className="text-gray-400"
                                    />
                                  )}

                                </div>

                                <div>

                                  <p className="text-sm font-medium">
                                    {
                                      reviewerName
                                    }
                                  </p>

                                  {review.createdAt && (
                                    <p className="mt-1 text-[11px] text-gray-400">
                                      {new Date(
                                        review.createdAt
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
                                  )}

                                </div>

                              </div>

                              <StarRating
                                rating={
                                  Number(
                                    review.rating ||
                                      0
                                  )
                                }
                                size={15}
                              />

                            </div>

                            <p className="mt-4 text-sm leading-7 text-gray-600">
                              {
                                review.comment
                              }
                            </p>

                          </article>
                        );
                      }
                    )}

                  </div>
                ) : (
                  <div className="flex min-h-[300px] items-center justify-center border border-gray-100 px-6 text-center">

                    <div>

                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
                        <Star
                          size={23}
                          className="text-gray-300"
                        />
                      </div>

                      <h3 className="mt-5 text-lg font-medium">
                        No reviews yet
                      </h3>

                      <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                        Be the first customer to share your experience with this product.
                      </p>

                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>

        </section>

      </div>
    );
  };

export default ProductDetails;
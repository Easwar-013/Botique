import React, {
  useEffect,
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import {
  motion,
} from 'framer-motion';

import api from '../../services/api';

import type {
  Product,
} from '../../types';

import {
  getImageUrl,
} from '../../utils/imageUrl';

/*
 * =========================================================
 * REMOTE HOMEPAGE MARKETING IMAGES
 * =========================================================
 *
 * These images are loaded directly from the internet.
 * You no longer need hero.webp, women.webp, men.webp,
 * dresses.webp, accessories.webp or promo.webp for this page.
 *
 * The ?auto=format&fit=crop&w=2400&q=90 parameters tell the
 * image CDN to return a high-quality, appropriately formatted
 * image.
 */

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=2400&q=90';

const WOMEN_IMAGE =
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=90';

const MEN_IMAGE =
  'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=1400&q=90';

const DRESSES_IMAGE =
  'https://images.unsplash.com/photo-1566206091558-7f218b696731?auto=format&fit=crop&w=1400&q=90';

const ACCESSORIES_IMAGE =
  'https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=1400&q=90';

const PROMO_IMAGE =
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=2400&q=90';


/*
 * =========================================================
 * CATEGORIES
 * =========================================================
 */

const categories = [
  {
    name: 'Women',
    image: WOMEN_IMAGE,
  },
  {
    name: 'Men',
    image: MEN_IMAGE,
  },
  {
    name: 'Dresses',
    image: DRESSES_IMAGE,
  },
  {
    name: 'Accessories',
    image: ACCESSORIES_IMAGE,
  },
];


/*
 * =========================================================
 * HOME
 * =========================================================
 */

const Home: React.FC = () => {
  /*
   * Latest products created by admin.
   */
  const [
    newArrivals,
    setNewArrivals,
  ] = useState<Product[]>([]);

  const [
    loadingNewArrivals,
    setLoadingNewArrivals,
  ] = useState(true);


  /*
   * =======================================================
   * LOAD LATEST PRODUCTS
   * =======================================================
   */
  useEffect(() => {
    const loadNewArrivals =
      async () => {
        try {
          setLoadingNewArrivals(true);

          const response =
            await api.get(
              '/products',
              {
                params: {
                  page: 1,
                  limit: 4,
                  sort: 'newest',
                },
              }
            );

          const products =
            response.data?.products ||
            [];

          /*
           * Convert local backend image paths
           * into complete URLs.
           */
          const normalizedProducts =
            products.map(
              (
                product: Product
              ) => ({
                ...product,

                images:
                  product.images?.map(
                    (image) => ({
                      ...image,

                      url:
                        getImageUrl(
                          image.url
                        ),
                    })
                  ) || [],
              })
            );

          setNewArrivals(
            normalizedProducts
          );
        } catch (error) {
          console.error(
            'Failed to load new arrivals:',
            error
          );

          setNewArrivals([]);
        } finally {
          setLoadingNewArrivals(
            false
          );
        }
      };

    loadNewArrivals();
  }, []);


  /*
   * =======================================================
   * GET PRODUCT IMAGE
   * =======================================================
   */
  const getProductImage = (
    product: Product
  ): string => {
    if (
      !product.images ||
      product.images.length === 0
    ) {
      return '';
    }

    return (
      product.images.find(
        (image) =>
          image.isPrimary
      )?.url ||
      product.images[0]?.url ||
      ''
    );
  };


  return (
    <div className="bg-white text-black">

      {/* ================================================= */}
      {/* HERO */}
      {/* ================================================= */}

      <section className="overflow-hidden bg-[#f5f3ef]">

        <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl lg:grid-cols-2">

          {/* --------------------------------------------- */}
          {/* Hero Text */}
          {/* --------------------------------------------- */}

          <motion.div
            initial={{
              opacity: 0,
              x: -35,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.8,
              ease: 'easeOut',
            }}
            className="flex items-center px-6 py-20 sm:px-10 lg:px-12"
          >
            <div className="max-w-xl">

              <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                New Collection 2026
              </p>

              <h1 className="mt-6 text-5xl font-light leading-[0.92] tracking-tight sm:text-7xl lg:text-[76px]">
                Define
                <br />
                Your Style.
              </h1>

              <p className="mt-7 max-w-md text-base leading-7 text-gray-600 sm:text-lg">
                Contemporary fashion designed
                for people who create their own
                identity.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">

                <Link
                  to="/shop"
                  className="rounded-full bg-black px-7 py-3.5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-gray-800"
                >
                  Shop Collection
                </Link>

                <Link
                  to="/shop?sort=newest"
                  className="rounded-full border border-black px-7 py-3.5 text-sm font-medium transition hover:bg-black hover:text-white"
                >
                  New Arrivals
                </Link>

              </div>

            </div>
          </motion.div>


          {/* --------------------------------------------- */}
          {/* Hero Image */}
          {/* --------------------------------------------- */}

          <motion.div
            initial={{
              opacity: 0,
              scale: 1.03,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              duration: 1,
              ease: 'easeOut',
            }}
            className="relative min-h-[520px] overflow-hidden lg:min-h-[calc(100vh-72px)]"
          >

            <img
              src={HERO_IMAGE}
              alt="BOUTIQUE New Collection"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-full min-h-[520px] w-full object-cover object-center lg:min-h-full"
            />

            <div className="pointer-events-none absolute inset-0 bg-black/5" />

          </motion.div>

        </div>

      </section>


      {/* ================================================= */}
      {/* SHOP BY CATEGORY */}
      {/* ================================================= */}

      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:px-8">

        <div className="flex items-end justify-between gap-6">

          <div>

            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Explore
            </p>

            <h2 className="mt-3 text-4xl font-light tracking-tight sm:text-5xl">
              Shop by Category
            </h2>

          </div>

          <Link
            to="/shop"
            className="hidden text-sm underline underline-offset-4 sm:block"
          >
            View All
          </Link>

        </div>


        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {categories.map(
            (category) => (
              <Link
                key={
                  category.name
                }
                to={`/shop?category=${encodeURIComponent(
                  category.name
                )}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-sm bg-neutral-100"
              >

                <img
                  src={
                    category.image
                  }
                  alt={`${category.name} collection`}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-6 text-white">

                  <h3 className="text-2xl font-light">
                    {
                      category.name
                    }
                  </h3>

                  <p className="mt-1 text-sm text-white/90">
                    Explore →
                  </p>

                </div>

              </Link>
            )
          )}

        </div>

      </section>


      {/* ================================================= */}
      {/* NEW ARRIVALS */}
      {/* ================================================= */}

      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">

        <div className="flex items-end justify-between gap-5">

          <div>

            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Latest
            </p>

            <h2 className="mt-3 text-4xl font-light tracking-tight sm:text-5xl">
              New Arrivals
            </h2>

            <p className="mt-3 text-sm text-gray-500">
              Fresh styles recently added to
              the collection.
            </p>

          </div>

          <Link
            to="/shop?sort=newest"
            className="text-sm underline underline-offset-4"
          >
            Shop All
          </Link>

        </div>


        {/* --------------------------------------------- */}
        {/* Loading */}
        {/* --------------------------------------------- */}

        {loadingNewArrivals && (
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">

            {Array.from({
              length: 4,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="animate-pulse"
                >

                  <div className="aspect-[4/5] bg-gray-100" />

                  <div className="mt-4 h-3 w-20 bg-gray-100" />

                  <div className="mt-3 h-4 w-32 bg-gray-100" />

                  <div className="mt-3 h-4 w-20 bg-gray-100" />

                </div>
              )
            )}

          </div>
        )}


        {/* --------------------------------------------- */}
        {/* Latest Products */}
        {/* --------------------------------------------- */}

        {!loadingNewArrivals &&
          newArrivals.length > 0 && (
            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">

              {newArrivals.map(
                (product) => {
                  const image =
                    getProductImage(
                      product
                    );

                  const finalPrice =
                    product.discountPrice ??
                    product.price;

                  return (
                    <Link
                      key={
                        product._id
                      }
                      to={`/products/${product._id}`}
                      className="group"
                    >

                      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">

                        {image ? (
                          <img
                            src={image}
                            alt={
                              product.name
                            }
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-gray-300">
                            No image
                          </div>
                        )}

                        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[10px] font-medium uppercase tracking-wider shadow-sm">
                          New
                        </span>

                      </div>


                      <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-gray-400">
                        {product.brand ||
                          'BOUTIQUE'}
                      </p>

                      <h3 className="mt-2 text-sm font-medium">
                        {
                          product.name
                        }
                      </h3>

                      <div className="mt-2 flex items-center gap-2">

                        <span className="text-sm font-medium">
                          ₹
                          {finalPrice.toLocaleString(
                            'en-IN'
                          )}
                        </span>

                        {product.discountPrice !==
                          undefined && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹
                            {product.price.toLocaleString(
                              'en-IN'
                            )}
                          </span>
                        )}

                      </div>

                    </Link>
                  );
                }
              )}

            </div>
          )}


        {/* --------------------------------------------- */}
        {/* No Products */}
        {/* --------------------------------------------- */}

        {!loadingNewArrivals &&
          newArrivals.length === 0 && (
            <div className="mt-10 rounded-2xl bg-gray-50 px-6 py-20 text-center">

              <h3 className="text-2xl font-light">
                New arrivals coming soon
              </h3>

              <p className="mt-3 text-sm text-gray-500">
                New products added by our team
                will appear here.
              </p>

              <Link
                to="/shop"
                className="mt-6 inline-block rounded-full bg-black px-6 py-3 text-sm text-white"
              >
                Browse Collection
              </Link>

            </div>
          )}

      </section>


      {/* ================================================= */}
      {/* PROMOTION */}
      {/* ================================================= */}

      <section className="relative min-h-[420px] overflow-hidden bg-black text-white">

        <img
          src={PROMO_IMAGE}
          alt="BOUTIQUE Limited Time Offer"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        <div className="absolute inset-0 bg-black/55" />

        <div className="relative mx-auto flex min-h-[420px] max-w-7xl items-center px-6 py-20 lg:px-8">

          <motion.div
            initial={{
              opacity: 0,
              y: 25,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.3,
            }}
            transition={{
              duration: 0.7,
            }}
            className="max-w-xl"
          >

            <p className="text-xs uppercase tracking-[0.3em] text-white/70">
              Limited Time
            </p>

            <h2 className="mt-5 text-5xl font-light tracking-tight sm:text-7xl">
              Up to 50% Off
            </h2>

            <p className="mt-5 max-w-md text-gray-200">
              Discover selected styles at exceptional
              prices.
            </p>

            <Link
              to="/shop"
              className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-sm font-medium text-black transition hover:bg-gray-200"
            >
              Shop Offers
            </Link>

          </motion.div>

        </div>
      </section>

    </div>
  );
};

export default Home;
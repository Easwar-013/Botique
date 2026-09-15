import React, {
  useEffect,
  useState,
} from 'react';

import {
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

import {
  useSearchParams,
} from 'react-router-dom';

import ProductCard from '../../components/common/ProductCard';

import api from '../../services/api';

import type { Product } from '../../types';

/* =========================================================
   CONSTANTS
========================================================= */

const PRODUCTS_PER_PAGE = 12;

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  'http://localhost:5000';

/* =========================================================
   IMAGE URL HELPER
========================================================= */

const getServerImageUrl = (
  imagePath: string
): string => {
  if (!imagePath) {
    return '';
  }

  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('data:')
  ) {
    return imagePath;
  }

  return `${SERVER_URL}${
    imagePath.startsWith('/')
      ? ''
      : '/'
  }${imagePath}`;
};

/* =========================================================
   SHOP
========================================================= */

const Shop: React.FC = () => {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);

  /* =======================================================
     URL FILTERS
  ======================================================= */

  const search =
    searchParams.get(
      'search'
    ) || '';

  const category =
    searchParams.get(
      'category'
    ) || '';

  const sort =
    searchParams.get(
      'sort'
    ) || 'newest';

  const filter =
    searchParams.get(
      'filter'
    ) || '';

  const currentPage = Math.max(
    Number(
      searchParams.get('page') || '1'
    ),
    1
  );

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  useEffect(() => {
    const loadProducts =
      async () => {
        try {
          setLoading(true);

          const response =
            await api.get(
              '/products',
              {
                params: {
                  search:
                    search.trim() ||
                    undefined,

                  category:
                    category ||
                    undefined,

                  sort,

                  page:
                    currentPage,

                  limit:
                    PRODUCTS_PER_PAGE,
                },
              }
            );

          let serverProducts =
            response.data
              ?.products || [];

          /*
           * Sale filter.
           *
           * A product is considered
           * a sale product when its
           * discount price is lower
           * than its original price.
           */
          if (
            filter === 'sale'
          ) {
            serverProducts =
              serverProducts.filter(
                (
                  product: Product
                ) =>
                  product.discountPrice !==
                    undefined &&
                  product.discountPrice <
                    product.price
              );
          }

          const normalizedProducts =
            serverProducts.map(
              (
                product: Product
              ) => ({
                ...product,

                images:
                  product.images?.map(
                    (image) => ({
                      ...image,

                      url:
                        getServerImageUrl(
                          image.url
                        ),
                    })
                  ) || [],
              })
            );

          setProducts(
            normalizedProducts
          );

          /*
           * Backend pagination data.
           */
          const pagination =
            response.data
              ?.pagination;

          const backendPages =
            Number(
              pagination?.pages
            ) || 1;

          setTotalPages(
            Math.max(
              backendPages,
              1
            )
          );
        } catch (error) {
          console.error(
            'Failed to load products:',
            error
          );

          setProducts([]);
          setTotalPages(1);
        } finally {
          setLoading(false);
        }
      };

    loadProducts();
  }, [
    search,
    category,
    sort,
    filter,
    currentPage,
  ]);

  /* =======================================================
     CHANGE PAGE
  ======================================================= */

  const changePage = (
    page: number
  ) => {
    const safePage = Math.min(
      Math.max(page, 1),
      totalPages
    );

    const params =
      new URLSearchParams(
        searchParams
      );

    if (safePage <= 1) {
      params.delete('page');
    } else {
      params.set(
        'page',
        String(safePage)
      );
    }

    setSearchParams(params);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  /* =======================================================
     RESET PAGE WHEN FILTERS CHANGE
  ======================================================= */

  useEffect(() => {
    if (
      currentPage > totalPages &&
      totalPages > 0
    ) {
      const params =
        new URLSearchParams(
          searchParams
        );

      if (totalPages === 1) {
        params.delete('page');
      } else {
        params.set(
          'page',
          String(totalPages)
        );
      }

      setSearchParams(
        params,
        {
          replace: true,
        }
      );
    }
  }, [
    currentPage,
    totalPages,
    searchParams,
    setSearchParams,
  ]);

  /* =======================================================
     PAGINATION BUTTONS
  ======================================================= */

  const getPaginationItems = (): Array<
    number | 'dots'
  > => {
    if (totalPages <= 1) {
      return [1];
    }

    if (totalPages <= 5) {
      return Array.from(
        {
          length: totalPages,
        },
        (_, index) =>
          index + 1
      );
    }

    if (currentPage <= 3) {
      return [
        1,
        2,
        3,
        4,
        'dots',
        totalPages,
      ];
    }

    if (
      currentPage >=
      totalPages - 2
    ) {
      return [
        1,
        'dots',
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      'dots',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      'dots',
      totalPages,
    ];
  };

  const paginationItems =
    getPaginationItems();

  /* =======================================================
     SORT LABEL
  ======================================================= */

  const getSortLabel = () => {
    switch (sort) {
      case 'price-low':
        return 'Price: Low to High';

      case 'price-high':
        return 'Price: High to Low';

      case 'name-asc':
        return 'Name: A-Z';

      case 'name-desc':
        return 'Name: Z-A';

      default:
        return 'Newest';
    }
  };

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <div className="min-h-screen bg-white">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <section className="border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">

          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 sm:text-xs">
            BOUTIQUE Collection
          </p>

          <h1 className="mt-3 text-4xl font-light tracking-tight sm:mt-4 sm:text-5xl lg:text-6xl">
            Shop
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-gray-500 sm:mt-5 sm:leading-7">
            Explore our latest
            collection of
            contemporary
            fashion.
          </p>

          {/* Active search/filter summary */}

          {(search ||
            category ||
            filter === 'sale') && (
            <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">

              {search && (
                <span className="rounded-full bg-gray-100 px-3 py-1.5 text-[11px] text-gray-600 sm:text-xs">
                  Search: {search}
                </span>
              )}

              {category && (
                <span className="rounded-full bg-gray-100 px-3 py-1.5 text-[11px] text-gray-600 sm:text-xs">
                  Category:{' '}
                  {category}
                </span>
              )}

              {filter ===
                'sale' && (
                <span className="rounded-full bg-black px-3 py-1.5 text-[11px] text-white sm:text-xs">
                  Sale
                </span>
              )}

            </div>
          )}

        </div>
      </section>

      {/* =================================================
          PRODUCTS
      ================================================= */}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">

        {loading ? (

          /* =================================================
             LOADING SKELETON
          ================================================= */

          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4 lg:gap-y-12">

            {Array.from({
              length:
                PRODUCTS_PER_PAGE,
            }).map(
              (
                _,
                index
              ) => (
                <div
                  key={index}
                  className="animate-pulse"
                >
                  <div className="aspect-[4/5] rounded-sm bg-gray-100" />

                  <div className="mt-3 h-3 w-16 rounded bg-gray-100 sm:mt-4 sm:w-20" />

                  <div className="mt-2 h-4 w-28 rounded bg-gray-100 sm:w-32" />

                  <div className="mt-2 h-3 w-14 rounded bg-gray-100 sm:w-16" />
                </div>
              )
            )}

          </div>

        ) : products.length === 0 ? (

          /* =================================================
             EMPTY STATE
          ================================================= */

          <div className="py-20 text-center sm:py-24">

            <Filter
              size={30}
              className="mx-auto text-gray-300"
            />

            <h2 className="mt-5 text-2xl font-light sm:text-3xl">
              No products found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Try another search
              or category.
            </p>

          </div>

        ) : (

          <>
            {/* =================================================
                SORT INFO
            ================================================= */}

            {sort !==
              'newest' && (
              <div className="mb-6 flex justify-end">
                <span className="text-xs text-gray-400">
                  Sorted by:{' '}
                  {getSortLabel()}
                </span>
              </div>
            )}

            {/* =================================================
                PRODUCT GRID
            ================================================= */}

            <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 sm:gap-y-12 lg:grid-cols-4">

              {products.map(
                (
                  product
                ) => (
                  <ProductCard
                    key={
                      product._id
                    }
                    product={
                      product
                    }
                  />
                )
              )}

            </div>

            {/* =================================================
                PAGINATION
            ================================================= */}

            {totalPages >
              1 && (
              <div className="mt-12 flex flex-col items-center gap-4 border-t border-gray-100 pt-8 sm:mt-16 sm:pt-10">

                {/* Mobile pagination */}

                <div className="flex items-center gap-2 sm:hidden">

                  <button
                    type="button"
                    onClick={() =>
                      changePage(
                        currentPage -
                          1
                      )
                    }
                    disabled={
                      currentPage ===
                      1
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 transition hover:border-black disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Previous page"
                  >
                    <ChevronLeft
                      size={16}
                    />
                  </button>

                  <span className="min-w-[100px] text-center text-sm text-gray-500">
                    Page{' '}
                    <span className="font-medium text-black">
                      {
                        currentPage
                      }
                    </span>{' '}
                    of{' '}
                    <span className="font-medium text-black">
                      {
                        totalPages
                      }
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      changePage(
                        currentPage +
                          1
                      )
                    }
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 transition hover:border-black disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Next page"
                  >
                    <ChevronRight
                      size={16}
                    />
                  </button>

                </div>

                {/* Desktop pagination */}

                <div className="hidden items-center gap-2 sm:flex">

                  <button
                    type="button"
                    onClick={() =>
                      changePage(
                        currentPage -
                          1
                      )
                    }
                    disabled={
                      currentPage ===
                      1
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 transition hover:border-black disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Previous page"
                  >
                    <ChevronLeft
                      size={16}
                    />
                  </button>

                  {paginationItems.map(
                    (
                      item,
                      index
                    ) =>
                      item ===
                      'dots' ? (
                        <span
                          key={`dots-${index}`}
                          className="flex h-10 w-10 items-center justify-center text-sm text-gray-400"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            changePage(
                              item
                            )
                          }
                          aria-current={
                            currentPage ===
                            item
                              ? 'page'
                              : undefined
                          }
                          className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm transition ${
                            currentPage ===
                            item
                              ? 'bg-black text-white'
                              : 'border border-gray-200 hover:border-black'
                          }`}
                        >
                          {item}
                        </button>
                      )
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      changePage(
                        currentPage +
                          1
                      )
                    }
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 transition hover:border-black disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Next page"
                  >
                    <ChevronRight
                      size={16}
                    />
                  </button>

                </div>

              </div>
            )}

          </>
        )}

      </section>
    </div>
  );
};

export default Shop;
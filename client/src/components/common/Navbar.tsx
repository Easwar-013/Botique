import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  AnimatePresence,
  motion,
} from 'framer-motion';

import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';

import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';

const categoryItems = [
  'Women',
  'Men',
  'Dresses',
  'Tops',
  'Shirts',
  'T-Shirts',
  'Jeans',
  'Trousers',
  'Skirts',
  'Ethnic Wear',
  'Activewear',
  'Outerwear',
  'Accessories',
  'Footwear',
];

const sortOptions = [
  {
    name: 'Newest',
    value: 'newest',
  },
  {
    name: 'Price: Low to High',
    value: 'price-low',
  },
  {
    name: 'Price: High to Low',
    value: 'price-high',
  },
  {
    name: 'Name: A-Z',
    value: 'name-asc',
  },
  {
    name: 'Name: Z-A',
    value: 'name-desc',
  },
];

const WISHLIST_BADGE_DURATION = 2500;

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    totalItems,
    setCartDrawerOpen,
  } = useCart();

  const { user } = useAuth();

  const { wishlist } = useWishlist();

  /* =====================================================
     UI STATE
  ===================================================== */

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const [
    categoriesOpen,
    setCategoriesOpen,
  ] = useState(false);

  const [
    showSearch,
    setShowSearch,
  ] = useState(false);

  const [
    searchCategoryOpen,
    setSearchCategoryOpen,
  ] = useState(false);

  const [
    searchSortOpen,
    setSearchSortOpen,
  ] = useState(false);

  /* =====================================================
     SEARCH STATE
  ===================================================== */

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('');

  const [
    searchCategory,
    setSearchCategory,
  ] = useState('');

  const [
    searchSort,
    setSearchSort,
  ] = useState('newest');

  /* =====================================================
     WISHLIST BADGE
  ===================================================== */

  const [
    showWishlistBadge,
    setShowWishlistBadge,
  ] = useState(false);

  const [
    wishlistBadgeCount,
    setWishlistBadgeCount,
  ] = useState(0);

  const wishlistTimer =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const previousWishlistCount =
    useRef<number | null>(null);

  const previousUserId =
    useRef<string | null>(null);

  const loginWishlistHandled =
    useRef(false);

  const wishlistCount =
    Array.isArray(wishlist)
      ? wishlist.length
      : 0;

  /* =====================================================
     USER
  ===================================================== */

  const profileImage =
    user?.avatar || null;

  const firstLetter =
    user?.name
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || 'U';

  /* =====================================================
     WISHLIST NOTIFICATION
  ===================================================== */

  const showWishlistNotification =
    (count: number) => {
      if (count <= 0) {
        return;
      }

      setWishlistBadgeCount(count);
      setShowWishlistBadge(true);

      if (wishlistTimer.current) {
        clearTimeout(
          wishlistTimer.current
        );
      }

      wishlistTimer.current =
        setTimeout(() => {
          setShowWishlistBadge(false);
        }, WISHLIST_BADGE_DURATION);
    };

  /*
   * Show wishlist count once
   * when customer logs in.
   */
  useEffect(() => {
    const currentUserId =
      user?._id || null;

    if (
      currentUserId &&
      previousUserId.current !==
        currentUserId
    ) {
      previousUserId.current =
        currentUserId;

      loginWishlistHandled.current =
        true;

      const timer =
        setTimeout(() => {
          if (wishlistCount > 0) {
            showWishlistNotification(
              wishlistCount
            );
          }
        }, 150);

      return () => {
        clearTimeout(timer);
      };
    }

    if (!currentUserId) {
      previousUserId.current = null;
      loginWishlistHandled.current =
        false;
    }

    return undefined;
  }, [
    user?._id,
    wishlistCount,
  ]);

  /*
   * Show wishlist count when
   * customer adds/removes an item.
   */
  useEffect(() => {
    const previous =
      previousWishlistCount.current;

    if (previous === null) {
      previousWishlistCount.current =
        wishlistCount;

      return;
    }

    if (previous !== wishlistCount) {
      previousWishlistCount.current =
        wishlistCount;

      /*
       * Ignore the first wishlist
       * change caused by login loading.
       */
      if (
        loginWishlistHandled.current
      ) {
        loginWishlistHandled.current =
          false;

        return;
      }

      if (wishlistCount > 0) {
        showWishlistNotification(
          wishlistCount
        );
      }
    }
  }, [wishlistCount]);

  /*
   * Cleanup wishlist timer.
   */
  useEffect(() => {
    return () => {
      if (wishlistTimer.current) {
        clearTimeout(
          wishlistTimer.current
        );
      }
    };
  }, []);

  /* =====================================================
     CLOSE MENUS
  ===================================================== */

  const closeMobileMenu = () => {
    setMobileOpen(false);
    setCategoriesOpen(false);
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchCategoryOpen(false);
    setSearchSortOpen(false);
  };

  /* =====================================================
     ACCOUNT
  ===================================================== */

  const handleAccountClick = () => {
    closeMobileMenu();
    closeSearch();

    navigate(
      user
        ? '/profile'
        : '/login'
    );
  };

  /* =====================================================
     WISHLIST
  ===================================================== */

  const handleWishlistClick = () => {
    closeMobileMenu();
    closeSearch();

    navigate('/wishlist');
  };

  /* =====================================================
     ROUTE HELPERS
  ===================================================== */

  const isActiveRoute = (
    pathname: string,
    search = ''
  ) => {
    return (
      location.pathname === pathname &&
      location.search === search
    );
  };

  const isCategoryActive = (
    category: string
  ) => {
    const currentCategory =
      new URLSearchParams(
        location.search
      ).get('category');

    return (
      location.pathname === '/shop' &&
      currentCategory === category
    );
  };

  /* =====================================================
     NAV STYLES
  ===================================================== */

  const desktopNavClass = (
    active: boolean
  ) =>
    `relative flex items-center gap-1 text-sm transition-all duration-300 ${
      active
        ? 'font-medium text-black'
        : 'text-gray-700 hover:text-black'
    }`;

  const mobileNavClass = (
    active: boolean
  ) =>
    `w-fit text-base transition-all duration-300 ${
      active
        ? 'font-medium text-black'
        : 'text-gray-700 hover:text-black'
    }`;

  /* =====================================================
     CATEGORY NAVIGATION
  ===================================================== */

  const handleCategoryClick = (
    category: string
  ) => {
    setCategoriesOpen(false);
    setMobileOpen(false);
    closeSearch();

    navigate(
      `/shop?category=${encodeURIComponent(
        category
      )}`
    );
  };

  /* =====================================================
     SALE
  ===================================================== */

  const handleSaleClick = () => {
    setCategoriesOpen(false);
    setMobileOpen(false);
    closeSearch();

    navigate('/shop?filter=sale');
  };

  /* =====================================================
     SEARCH OPEN
  ===================================================== */

  const openSearch = () => {
    closeMobileMenu();

    const params =
      new URLSearchParams(
        location.search
      );

    setSearchQuery(
      params.get('search') || ''
    );

    setSearchCategory(
      params.get('category') || ''
    );

    setSearchSort(
      params.get('sort') ||
        'newest'
    );

    setShowSearch(true);
  };

  /* =====================================================
     SEARCH SUBMIT
  ===================================================== */

  const handleSearch = (
    event?: React.FormEvent
  ) => {
    event?.preventDefault();

    const params =
      new URLSearchParams();

    /*
     * Normalize search keywords.
     *
     * Example:
     * "orange shirt"
     * -> "orange shirt"
     *
     * Extra spaces are removed so the backend
     * receives clean keywords.
    */
    const normalizedSearch =
      searchQuery
        .trim()
        .replace(/\s+/g, ' ');

    if (normalizedSearch) {
      params.set(
        'search',
        normalizedSearch
      );
    }

    if (searchCategory) {
      params.set(
        'category',
        searchCategory
      );
    }

    if (
      searchSort &&
      searchSort !== 'newest'
    ) {
      params.set(
        'sort',
        searchSort
      );
    }

    closeSearch();

    navigate(
      `/shop${
        params.toString()
          ? `?${params.toString()}`
          : ''
      }`
    );
  };

  /* =====================================================
     SELECTED FILTER LABELS
  ===================================================== */

  const selectedCategoryName =
    searchCategory ||
    'All Categories';

  const selectedSortName =
    sortOptions.find(
      (item) =>
        item.value === searchSort
    )?.name || 'Newest';

  /* =====================================================
     RETURN
  ===================================================== */

  return (
    <>
      {/* =================================================
          NAVBAR
      ================================================= */}

      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-xl">

        <div className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">

          {/* =================================================
              MOBILE MENU
          ================================================= */}

          <div className="w-10 md:hidden">
            <button
              type="button"
              onClick={() =>
                setMobileOpen(
                  (value) => !value
                )
              }
              className="rounded-full p-2 transition hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X size={22} />
              ) : (
                <Menu size={22} />
              )}
            </button>
          </div>

          {/* =================================================
              LOGO
          ================================================= */}

          <Link
            to="/"
            onClick={() =>
              closeSearch()
            }
            className="shrink-0 text-xl font-semibold tracking-[0.25em] transition-opacity duration-300 hover:opacity-70 md:text-2xl"
          >
            BOUTIQUE
          </Link>

          {/* =================================================
              DESKTOP NAVIGATION / SEARCH
              
              IMPORTANT:
              The wrapper is vertically centered,
              but the search panel itself is only
              56px high so it stays completely
              inside the 80px navbar.
          ================================================= */}

          <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">

            <AnimatePresence mode="wait">

              {/* =================================================
                  NORMAL NAVIGATION
              ================================================= */}

              {!showSearch ? (
                <motion.nav
                  key="desktop-nav"
                  initial={{
                    opacity: 0,
                    y: 4,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -4,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                  className="flex items-center gap-8 whitespace-nowrap"
                >
                  {/* Home */}

                  <Link
                    to="/"
                    className={desktopNavClass(
                      isActiveRoute('/')
                    )}
                  >
                    Home

                    <span
                      className={`absolute -bottom-2 left-0 h-[1.5px] bg-black transition-all duration-300 ${
                        isActiveRoute('/')
                          ? 'w-full'
                          : 'w-0'
                      }`}
                    />
                  </Link>

                  {/* Shop */}

                  <Link
                    to="/shop"
                    className={desktopNavClass(
                      isActiveRoute(
                        '/shop'
                      )
                    )}
                  >
                    Shop

                    <span
                      className={`absolute -bottom-2 left-0 h-[1.5px] bg-black transition-all duration-300 ${
                        isActiveRoute(
                          '/shop'
                        )
                          ? 'w-full'
                          : 'w-0'
                      }`}
                    />
                  </Link>

                  {/* Categories */}

                  <div className="relative">

                    <button
                      type="button"
                      onClick={() =>
                        setCategoriesOpen(
                          (value) =>
                            !value
                        )
                      }
                      className={desktopNavClass(
                        location.pathname ===
                          '/shop' &&
                          new URLSearchParams(
                            location.search
                          ).has(
                            'category'
                          )
                      )}
                    >
                      Categories

                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-300 ${
                          categoriesOpen
                            ? 'rotate-180'
                            : ''
                        }`}
                      />

                      <span
                        className={`absolute -bottom-2 left-0 h-[1.5px] bg-black transition-all duration-300 ${
                          location.pathname ===
                            '/shop' &&
                          new URLSearchParams(
                            location.search
                          ).has(
                            'category'
                          )
                            ? 'w-full'
                            : 'w-0'
                        }`}
                      />
                    </button>

                    <div
                      className={`absolute left-1/2 top-full mt-5 w-[520px] -translate-x-1/2 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl transition-all duration-300 ${
                        categoriesOpen
                          ? 'visible translate-y-0 opacity-100'
                          : 'pointer-events-none invisible -translate-y-2 opacity-0'
                      }`}
                    >
                      <div className="mb-5">
                        <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                          Shop by Category
                        </p>

                        <h3 className="mt-2 text-lg font-medium">
                          Find your style
                        </h3>
                      </div>

                      <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                        {categoryItems.map(
                          (
                            category
                          ) => (
                            <button
                              key={
                                category
                              }
                              type="button"
                              onClick={() =>
                                handleCategoryClick(
                                  category
                                )
                              }
                              className={`text-left text-sm transition-all duration-200 hover:translate-x-1 ${
                                isCategoryActive(
                                  category
                                )
                                  ? 'font-medium text-black'
                                  : 'text-gray-500 hover:text-black'
                              }`}
                            >
                              {
                                category
                              }
                            </button>
                          )
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Sale */}

                  <button
                    type="button"
                    onClick={
                      handleSaleClick
                    }
                    className={desktopNavClass(
                      isActiveRoute(
                        '/shop',
                        '?filter=sale'
                      )
                    )}
                  >
                    Sale

                    <span
                      className={`absolute -bottom-2 left-0 h-[1.5px] bg-black transition-all duration-300 ${
                        isActiveRoute(
                          '/shop',
                          '?filter=sale'
                        )
                          ? 'w-full'
                          : 'w-0'
                      }`}
                    />
                  </button>
                </motion.nav>
              ) : (

                /* =================================================
                   DESKTOP SEARCH
                ================================================= */

                <motion.form
                  key="desktop-search"
                  onSubmit={
                    handleSearch
                  }
                  initial={{
                    opacity: 0,
                    width: 280,
                    scale: 0.96,
                  }}
                  animate={{
                    opacity: 1,
                    width: 720,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    width: 280,
                    scale: 0.96,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 28,
                  }}
                  className="relative z-[100] w-[720px] max-w-[calc(100vw-260px)]"
                >

                  {/* =================================================
                      SINGLE ROW SEARCH BAR
                  ================================================= */}

                  <div className="flex h-14 w-full items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 shadow-[0_18px_50px_rgba(0,0,0,0.12)]">

                    {/* Search icon */}

                    <Search
                      size={19}
                      className="ml-2 shrink-0 text-gray-400"
                    />

                    {/* Search input */}

                    <input
                      autoFocus
                      type="text"
                      value={
                        searchQuery
                      }
                      onChange={(
                        event
                      ) =>
                        setSearchQuery(
                          event.target
                            .value
                        )
                      }
                      placeholder="Search products..."
                      className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-gray-400"
                    />

                    {/* Category */}

                    <div className="relative shrink-0">

                      <button
                        type="button"
                        onClick={() => {
                          setSearchCategoryOpen(
                            (
                              value
                            ) =>
                              !value
                          );

                          setSearchSortOpen(
                            false
                          );
                        }}
                        className="flex h-9 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 text-xs transition hover:border-black"
                      >
                        <span className="max-w-[115px] truncate">
                          {
                            selectedCategoryName
                          }
                        </span>

                        <ChevronDown
                          size={
                            13
                          }
                          className={`shrink-0 transition-transform ${
                            searchCategoryOpen
                              ? 'rotate-180'
                              : ''
                          }`}
                        />
                      </button>

                      <AnimatePresence>
                        {searchCategoryOpen && (
                          <motion.div
                            initial={{
                              opacity: 0,
                              y: -6,
                              scale: 0.97,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              scale: 1,
                            }}
                            exit={{
                              opacity: 0,
                              y: -6,
                              scale: 0.97,
                            }}
                            className="absolute left-0 top-[calc(100%+8px)] z-[200] max-h-64 min-w-[190px] overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-xl"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSearchCategory(
                                  ''
                                );

                                setSearchCategoryOpen(
                                  false
                                );
                              }}
                              className={`w-full rounded-lg px-3 py-2 text-left text-xs transition hover:bg-gray-50 ${
                                !searchCategory
                                  ? 'bg-gray-100 font-medium'
                                  : ''
                              }`}
                            >
                              All Categories
                            </button>

                            {categoryItems.map(
                              (
                                category
                              ) => (
                                <button
                                  key={
                                    category
                                  }
                                  type="button"
                                  onClick={() => {
                                    setSearchCategory(
                                      category
                                    );

                                    setSearchCategoryOpen(
                                      false
                                    );
                                  }}
                                  className={`w-full rounded-lg px-3 py-2 text-left text-xs transition hover:bg-gray-50 ${
                                    searchCategory ===
                                    category
                                      ? 'bg-gray-100 font-medium'
                                      : ''
                                  }`}
                                >
                                  {
                                    category
                                  }
                                </button>
                              )
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>

                    {/* Sort */}

                    <div className="relative shrink-0">

                      <button
                        type="button"
                        onClick={() => {
                          setSearchSortOpen(
                            (
                              value
                            ) =>
                              !value
                          );

                          setSearchCategoryOpen(
                            false
                          );
                        }}
                        className="flex h-9 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 text-xs transition hover:border-black"
                      >
                        <span className="max-w-[90px] truncate">
                          {
                            selectedSortName
                          }
                        </span>

                        <ChevronDown
                          size={
                            13
                          }
                          className={`shrink-0 transition-transform ${
                            searchSortOpen
                              ? 'rotate-180'
                              : ''
                          }`}
                        />
                      </button>

                      <AnimatePresence>
                        {searchSortOpen && (
                          <motion.div
                            initial={{
                              opacity: 0,
                              y: -6,
                              scale: 0.97,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              scale: 1,
                            }}
                            exit={{
                              opacity: 0,
                              y: -6,
                              scale: 0.97,
                            }}
                            className="absolute right-0 top-[calc(100%+8px)] z-[200] min-w-[190px] overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-xl"
                          >
                            {sortOptions.map(
                              (
                                option
                              ) => (
                                <button
                                  key={
                                    option.value
                                  }
                                  type="button"
                                  onClick={() => {
                                    setSearchSort(
                                      option.value
                                    );

                                    setSearchSortOpen(
                                      false
                                    );
                                  }}
                                  className={`w-full rounded-lg px-3 py-2 text-left text-xs transition hover:bg-gray-50 ${
                                    searchSort ===
                                    option.value
                                      ? 'bg-gray-100 font-medium'
                                      : ''
                                  }`}
                                >
                                  {
                                    option.name
                                  }
                                </button>
                              )
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>

                    {/* Search button */}

                    <button
                      type="submit"
                      className="shrink-0 rounded-full bg-black px-5 py-2.5 text-xs font-medium text-white transition hover:bg-gray-800"
                    >
                      Search
                    </button>

                  </div>

                </motion.form>
              )}

            </AnimatePresence>
          </div>

          {/* =================================================
              RIGHT ACTIONS
          ================================================= */}

          <div className="flex items-center gap-1">

            {/* Search / Close */}

            <motion.button
              type="button"
              onClick={() => {
                if (showSearch) {
                  closeSearch();
                } else {
                  openSearch();
                }
              }}
              whileTap={{
                scale: 0.92,
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100"
              aria-label={
                showSearch
                  ? 'Close search'
                  : 'Search'
              }
            >
              <AnimatePresence
                mode="wait"
                initial={false}
              >
                {!showSearch ? (
                  <motion.span
                    key="search"
                    initial={{
                      opacity: 0,
                      scale: 0.7,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.7,
                    }}
                  >
                    <Search size={21} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="close"
                    initial={{
                      opacity: 0,
                      scale: 0.7,
                      rotate: -45,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      rotate: 0,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.7,
                    }}
                  >
                    <X size={21} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Wishlist */}

            <button
              type="button"
              onClick={
                handleWishlistClick
              }
              className="relative rounded-full p-2 transition hover:bg-gray-100"
              aria-label="Wishlist"
            >
              <Heart size={20} />

              <span
                className={`absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[9px] font-medium text-white transition-all duration-500 ${
                  showWishlistBadge
                    ? 'translate-y-0 scale-100 opacity-100'
                    : 'pointer-events-none -translate-y-2 scale-50 opacity-0'
                }`}
              >
                {wishlistBadgeCount > 99
                  ? '99+'
                  : wishlistBadgeCount}
              </span>
            </button>

            {/* Account */}

            <button
              type="button"
              onClick={
                handleAccountClick
              }
              className="hidden items-center gap-2 rounded-full px-2 py-2 text-sm transition hover:bg-gray-100 sm:flex"
            >
              {user ? (
                profileImage ? (
                  <img
                    src={profileImage}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-200"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-medium text-white">
                    {firstLetter}
                  </span>
                )
              ) : (
                <User size={18} />
              )}

              <span>
                {user
                  ? 'Account'
                  : 'Sign In'}
              </span>
            </button>

            {/* Cart */}

            <button
              type="button"
              onClick={() =>
                setCartDrawerOpen(true)
              }
              className="relative rounded-full p-2 transition hover:bg-gray-100"
              aria-label="Cart"
            >
              <ShoppingBag size={20} />

              {totalItems > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[9px] text-white">
                  {totalItems > 99
                    ? '99+'
                    : totalItems}
                </span>
              )}
            </button>

          </div>

        </div>
      </header>

      {/* =================================================
          MOBILE NAVIGATION
      ================================================= */}

      <AnimatePresence>
        {mobileOpen &&
          !showSearch && (
            <motion.div
              initial={{
                opacity: 0,
                y: -10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -10,
              }}
              className="fixed inset-x-0 top-[80px] z-40 border-b border-gray-200 bg-white px-6 shadow-lg md:hidden"
            >
              <nav className="flex flex-col gap-5 py-6">

                {/* Home */}

                <Link
                  to="/"
                  onClick={
                    closeMobileMenu
                  }
                  className={mobileNavClass(
                    isActiveRoute('/')
                  )}
                >
                  Home
                </Link>

                {/* Shop */}

                <Link
                  to="/shop"
                  onClick={
                    closeMobileMenu
                  }
                  className={mobileNavClass(
                    isActiveRoute(
                      '/shop'
                    )
                  )}
                >
                  Shop
                </Link>

                {/* Categories */}

                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setCategoriesOpen(
                        (value) =>
                          !value
                      )
                    }
                    className="flex items-center gap-2 text-base"
                  >
                    Categories

                    <ChevronDown
                      size={15}
                      className={`transition-transform ${
                        categoriesOpen
                          ? 'rotate-180'
                          : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {categoriesOpen && (
                      <motion.div
                        initial={{
                          height: 0,
                          opacity: 0,
                        }}
                        animate={{
                          height: 'auto',
                          opacity: 1,
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                        }}
                        className="mt-4 ml-4 grid grid-cols-2 gap-3 overflow-hidden border-l border-gray-200 pl-4"
                      >
                        {categoryItems.map(
                          (
                            category
                          ) => (
                            <button
                              key={
                                category
                              }
                              type="button"
                              onClick={() =>
                                handleCategoryClick(
                                  category
                                )
                              }
                              className="text-left text-sm text-gray-600"
                            >
                              {
                                category
                              }
                            </button>
                          )
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Sale */}

                <button
                  type="button"
                  onClick={
                    handleSaleClick
                  }
                  className="text-left text-base"
                >
                  Sale
                </button>

                {/* Wishlist */}

                <button
                  type="button"
                  onClick={
                    handleWishlistClick
                  }
                  className="flex items-center gap-3 text-left text-base"
                >
                  <div className="relative">
                    <Heart size={18} />

                    <span
                      className={`absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[9px] text-white transition-all duration-500 ${
                        showWishlistBadge
                          ? 'scale-100 opacity-100'
                          : 'pointer-events-none scale-50 opacity-0'
                      }`}
                    >
                      {wishlistBadgeCount > 99
                        ? '99+'
                        : wishlistBadgeCount}
                    </span>
                  </div>

                  Wishlist
                </button>

                {/* Search */}

                <button
                  type="button"
                  onClick={
                    openSearch
                  }
                  className="flex items-center gap-3 text-left text-base"
                >
                  <Search size={18} />
                  Search
                </button>

                {/* Account */}

                <button
                  type="button"
                  onClick={
                    handleAccountClick
                  }
                  className="flex items-center gap-3 text-left text-base"
                >
                  {user
                    ? 'My Account'
                    : 'Sign In'}
                </button>

              </nav>
            </motion.div>
          )}
      </AnimatePresence>

      {/* =================================================
          MOBILE SEARCH
      ================================================= */}

      <AnimatePresence>
        {showSearch && (
          <motion.form
            onSubmit={
              handleSearch
            }
            initial={{
              opacity: 0,
              y: -15,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -15,
              scale: 0.98,
            }}
            className="fixed inset-x-4 top-[76px] z-50 rounded-2xl border border-gray-200 bg-white shadow-2xl md:hidden"
          >
            {/* Search */}

            <div className="flex h-14 items-center gap-3 px-4">

              <Search
                size={19}
                className="text-gray-400"
              />

              <input
                autoFocus
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Search products..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />

              <button
                type="submit"
                className="rounded-full bg-black px-4 py-2 text-xs text-white"
              >
                Search
              </button>

              <button
                type="button"
                onClick={
                  closeSearch
                }
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
                aria-label="Close search"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile filters */}

            <div className="flex flex-wrap gap-2 border-t border-gray-100 p-3">

              <select
                value={
                  searchCategory
                }
                onChange={(event) =>
                  setSearchCategory(
                    event.target
                      .value
                  )
                }
                className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs outline-none"
              >
                <option value="">
                  All Categories
                </option>

                {categoryItems.map(
                  (category) => (
                    <option
                      key={
                        category
                      }
                      value={
                        category
                      }
                    >
                      {category}
                    </option>
                  )
                )}
              </select>

              <select
                value={searchSort}
                onChange={(event) =>
                  setSearchSort(
                    event.target.value
                  )
                }
                className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs outline-none"
              >
                {sortOptions.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.name}
                    </option>
                  )
                )}
              </select>

            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
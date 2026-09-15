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
  Search,
  X,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(
  ...inputs: unknown[]
): string {
  return twMerge(clsx(inputs));
}

export interface SearchCategory {
  name: string;
  value: string;
}

export interface SearchSort {
  name: string;
  value: string;
}

interface ExpandingSearchDockProps {
  query: string;

  onQueryChange: (
    value: string
  ) => void;

  onSearch: () => void;

  categories: SearchCategory[];

  selectedCategory: string;

  onCategoryChange: (
    value: string
  ) => void;

  sortOptions: SearchSort[];

  selectedSort: string;

  onSortChange: (
    value: string
  ) => void;

  placeholder?: string;
}

const ExpandingSearchDock: React.FC<
  ExpandingSearchDockProps
> = ({
  query,
  onQueryChange,
  onSearch,
  categories,
  selectedCategory,
  onCategoryChange,
  sortOptions,
  selectedSort,
  onSortChange,
  placeholder = 'Search products...',
}) => {
  const [
    isExpanded,
    setIsExpanded,
  ] = useState(false);

  const [
    categoriesOpen,
    setCategoriesOpen,
  ] = useState(false);

  const [
    sortOpen,
    setSortOpen,
  ] = useState(false);

  const wrapperRef =
    useRef<HTMLDivElement>(null);

  /* =====================================================
     CLOSE WHEN CLICKING OUTSIDE
  ===================================================== */

  useEffect(() => {
    const handleOutsideClick = (
      event: MouseEvent
    ) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node
        )
      ) {
        setIsExpanded(false);
        setCategoriesOpen(false);
        setSortOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );
    };
  }, []);

  /* =====================================================
     ESCAPE KEY
  ===================================================== */

  useEffect(() => {
    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === 'Escape'
      ) {
        setIsExpanded(false);
        setCategoriesOpen(false);
        setSortOpen(false);
      }
    };

    document.addEventListener(
      'keydown',
      handleEscape
    );

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape
      );
    };
  }, []);

  /* =====================================================
     SELECTED LABELS
  ===================================================== */

  const selectedCategoryName =
    categories.find(
      (item) =>
        item.value ===
        selectedCategory
    )?.name ||
    'All Categories';

  const selectedSortName =
    sortOptions.find(
      (item) =>
        item.value ===
        selectedSort
    )?.name ||
    'Newest';

  /* =====================================================
     SEARCH
  ===================================================== */

  const handleSubmit = (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setCategoriesOpen(false);
    setSortOpen(false);

    onSearch();
  };

  /* =====================================================
     CLOSE
  ===================================================== */

  const handleCollapse = () => {
    setIsExpanded(false);
    setCategoriesOpen(false);
    setSortOpen(false);
  };

  return (
    <div
      ref={wrapperRef}
      className="relative"
    >
      <AnimatePresence mode="wait">

        {/* =================================================
            SEARCH ICON
        ================================================= */}

        {!isExpanded ? (
          <motion.button
            key="search-button"
            type="button"
            initial={{
              scale: 0.85,
              opacity: 0,
            }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            exit={{
              scale: 0.85,
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
            }}
            onClick={() =>
              setIsExpanded(true)
            }
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100"
            aria-label="Search"
          >
            <Search size={20} />
          </motion.button>
        ) : (

          /* =================================================
             SEARCH PANEL
          ================================================= */

          <motion.div
            key="search-panel"
            initial={{
              width: 40,
              opacity: 0,
              scaleX: 0.92,
            }}
            animate={{
              width: 560,
              opacity: 1,
              scaleX: 1,
            }}
            exit={{
              width: 40,
              opacity: 0,
              scaleX: 0.92,
            }}
            transition={{
              type: 'spring',
              stiffness: 280,
              damping: 28,
            }}
            className="absolute right-0 top-1/2 z-50 -translate-y-1/2 origin-right"
          >

            <form
              onSubmit={
                handleSubmit
              }
              className="overflow-visible rounded-2xl border border-gray-200 bg-white shadow-[0_18px_60px_rgba(0,0,0,0.12)]"
            >

              {/* =================================================
                  SEARCH ROW
              ================================================= */}

              <div className="flex h-14 items-center gap-2 px-3">

                <Search
                  size={18}
                  className="ml-2 shrink-0 text-gray-400"
                />

                <input
                  type="text"
                  value={query}
                  onChange={(event) =>
                    onQueryChange(
                      event.target.value
                    )
                  }
                  placeholder={
                    placeholder
                  }
                  autoFocus
                  className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-gray-400"
                />

                <button
                  type="submit"
                  className="hidden rounded-full bg-black px-4 py-2 text-xs font-medium text-white transition hover:bg-gray-800 sm:block"
                >
                  Search
                </button>

                <button
                  type="button"
                  onClick={
                    handleCollapse
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100"
                  aria-label="Close search"
                >
                  <X size={17} />
                </button>

              </div>

              {/* =================================================
                  FILTERS
              ================================================= */}

              <motion.div
                initial={{
                  opacity: 0,
                  y: -5,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.08,
                  duration: 0.2,
                }}
                className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-4 py-3"
              >

                <SlidersHorizontal
                  size={15}
                  className="text-gray-400"
                />

                {/* =================================================
                    CATEGORY
                ================================================= */}

                <div className="relative">

                  <button
                    type="button"
                    onClick={() => {
                      setCategoriesOpen(
                        (value) =>
                          !value
                      );

                      setSortOpen(false);
                    }}
                    className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-xs transition hover:border-black"
                  >

                    <span>
                      {
                        selectedCategoryName
                      }
                    </span>

                    <ChevronDown
                      size={13}
                      className={cn(
                        'transition-transform',
                        categoriesOpen &&
                          'rotate-180'
                      )}
                    />

                  </button>

                  <AnimatePresence>
                    {categoriesOpen && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: -5,
                          scale: 0.97,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          y: -5,
                          scale: 0.97,
                        }}
                        className="absolute left-0 top-[calc(100%+0.5rem)] z-[60] max-h-64 min-w-[180px] overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-xl"
                      >

                        <button
                          type="button"
                          onClick={() => {
                            onCategoryChange(
                              ''
                            );

                            setCategoriesOpen(
                              false
                            );
                          }}
                          className={cn(
                            'w-full rounded-lg px-3 py-2 text-left text-xs transition hover:bg-gray-50',
                            !selectedCategory &&
                              'bg-gray-100 font-medium'
                          )}
                        >
                          All Categories
                        </button>

                        {categories.map(
                          (
                            category
                          ) => (
                            <button
                              key={
                                category.value
                              }
                              type="button"
                              onClick={() => {
                                onCategoryChange(
                                  category.value
                                );

                                setCategoriesOpen(
                                  false
                                );
                              }}
                              className={cn(
                                'w-full rounded-lg px-3 py-2 text-left text-xs transition hover:bg-gray-50',
                                selectedCategory ===
                                  category.value &&
                                  'bg-gray-100 font-medium'
                              )}
                            >
                              {
                                category.name
                              }
                            </button>
                          )
                        )}

                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>

                {/* =================================================
                    SORT
                ================================================= */}

                <div className="relative">

                  <button
                    type="button"
                    onClick={() => {
                      setSortOpen(
                        (value) =>
                          !value
                      );

                      setCategoriesOpen(
                        false
                      );
                    }}
                    className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-xs transition hover:border-black"
                  >

                    <span>
                      {
                        selectedSortName
                      }
                    </span>

                    <ChevronDown
                      size={13}
                      className={cn(
                        'transition-transform',
                        sortOpen &&
                          'rotate-180'
                      )}
                    />

                  </button>

                  <AnimatePresence>
                    {sortOpen && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: -5,
                          scale: 0.97,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          y: -5,
                          scale: 0.97,
                        }}
                        className="absolute right-0 top-[calc(100%+0.5rem)] z-[60] min-w-[190px] overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-xl"
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
                                onSortChange(
                                  option.value
                                );

                                setSortOpen(
                                  false
                                );
                              }}
                              className={cn(
                                'w-full rounded-lg px-3 py-2 text-left text-xs transition hover:bg-gray-50',
                                selectedSort ===
                                  option.value &&
                                  'bg-gray-100 font-medium'
                              )}
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

                {/* =================================================
                    MOBILE SEARCH BUTTON
                ================================================= */}

                <button
                  type="submit"
                  className="ml-auto rounded-full bg-black px-4 py-2 text-xs font-medium text-white sm:hidden"
                >
                  Search
                </button>

              </motion.div>

            </form>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default ExpandingSearchDock;
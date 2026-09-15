import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import type { ReactNode } from 'react';
import type { Product } from '../types';

interface WishlistContextType {
  wishlist: Product[];

  isInWishlist: (
    productId: string
  ) => boolean;

  addToWishlist: (
    product: Product
  ) => void;

  removeFromWishlist: (
    productId: string
  ) => void;

  toggleWishlist: (
    product: Product
  ) => void;

  clearWishlist: () => void;
}

const WishlistContext =
  createContext<
    WishlistContextType | undefined
  >(undefined);

const WISHLIST_STORAGE_KEY =
  'hangover_wishlist';

export const WishlistProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  /*
   * Load wishlist from localStorage.
   */
  const [
    wishlist,
    setWishlist,
  ] = useState<Product[]>(() => {
    try {
      const saved =
        localStorage.getItem(
          WISHLIST_STORAGE_KEY
        );

      if (!saved) {
        return [];
      }

      const parsed =
        JSON.parse(saved);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch (error) {
      console.error(
        'Failed to load wishlist:',
        error
      );

      return [];
    }
  });

  /*
   * Save wishlist whenever it changes.
   */
  useEffect(() => {
    try {
      localStorage.setItem(
        WISHLIST_STORAGE_KEY,
        JSON.stringify(wishlist)
      );
    } catch (error) {
      console.error(
        'Failed to save wishlist:',
        error
      );
    }
  }, [wishlist]);

  /*
   * Check whether a product is
   * already in the wishlist.
   */
  const isInWishlist = (
    productId: string
  ): boolean => {
    return wishlist.some(
      (product) =>
        product._id === productId
    );
  };

  /*
   * Add product.
   *
   * Duplicate products are ignored.
   */
  const addToWishlist = (
    product: Product
  ): void => {
    setWishlist((previous) => {
      const alreadyExists =
        previous.some(
          (item) =>
            item._id === product._id
        );

      if (alreadyExists) {
        return previous;
      }

      return [
        ...previous,
        product,
      ];
    });
  };

  /*
   * Remove product.
   */
  const removeFromWishlist = (
    productId: string
  ): void => {
    setWishlist((previous) =>
      previous.filter(
        (product) =>
          product._id !== productId
      )
    );
  };

  /*
   * Add / remove product.
   */
  const toggleWishlist = (
    product: Product
  ): void => {
    setWishlist((previous) => {
      const exists =
        previous.some(
          (item) =>
            item._id === product._id
        );

      if (exists) {
        return previous.filter(
          (item) =>
            item._id !== product._id
        );
      }

      return [
        ...previous,
        product,
      ];
    });
  };

  /*
   * Clear the entire wishlist.
   */
  const clearWishlist = (): void => {
    setWishlist([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist =
  (): WishlistContextType => {
    const context =
      useContext(
        WishlistContext
      );

    if (!context) {
      throw new Error(
        'useWishlist must be used inside WishlistProvider'
      );
    }

    return context;
  };
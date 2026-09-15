import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

import type { ReactNode } from 'react';

import type {
  Product,
  CartItem,
} from '../types';

interface CartContextType {
  cart: CartItem[];

  addToCart: (
    product: Product,
    size: string,
    color?: string,
    qty?: number
  ) => boolean;

  removeFromCart: (
    productId: string,
    size: string,
    color?: string
  ) => void;

  updateQuantity: (
    productId: string,
    size: string,
    qty: number,
    color?: string
  ) => void;

  clearCart: () => void;

  subtotal: number;
  totalItems: number;

  isCartDrawerOpen: boolean;

  setCartDrawerOpen: (
    open: boolean
  ) => void;
}

const CartContext =
  createContext<
    CartContextType | undefined
  >(undefined);

const loadSavedCart = (): CartItem[] => {
  const token =
    localStorage.getItem(
      'hangover_token'
    );

  if (!token) {
    return [];
  }

  try {
    const saved =
      localStorage.getItem(
        'hangover_cart'
      );

    if (!saved) {
      return [];
    }

    return JSON.parse(
      saved
    ) as CartItem[];
  } catch (error) {
    console.error(
      'Failed to load cart:',
      error
    );

    return [];
  }
};

export const CartProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [cart, setCart] =
    useState<CartItem[]>(
      loadSavedCart
    );

  const [
    isCartDrawerOpen,
    setCartDrawerOpen,
  ] = useState(false);

  /*
   * Save cart only while authenticated.
   */
  useEffect(() => {
    const token =
      localStorage.getItem(
        'hangover_token'
      );

    if (token) {
      localStorage.setItem(
        'hangover_cart',
        JSON.stringify(cart)
      );
    } else {
      localStorage.removeItem(
        'hangover_cart'
      );
    }
  }, [cart]);

  /*
   * React to login/logout.
   */
  useEffect(() => {
    const handleAuthChange =
      () => {
        const token =
          localStorage.getItem(
            'hangover_token'
          );

        if (!token) {
          setCart([]);
          setCartDrawerOpen(false);
          return;
        }

        setCart(loadSavedCart());
      };

    window.addEventListener(
      'hangover:auth-changed',
      handleAuthChange
    );

    return () => {
      window.removeEventListener(
        'hangover:auth-changed',
        handleAuthChange
      );
    };
  }, []);

  /*
   * Add product
   */
  const addToCart = (
    product: Product,
    size: string,
    color?: string,
    qty = 1
  ): boolean => {
    const token =
      localStorage.getItem(
        'hangover_token'
      );

    /*
     * Not logged in:
     * do not modify cart.
     */
    if (!token) {
      return false;
    }

    if (product.stock <= 0) {
      return false;
    }

    setCart((prev) => {
      const existingIndex =
        prev.findIndex(
          (item) =>
            item.product._id ===
              product._id &&
            item.size === size &&
            item.color === color
        );

      if (existingIndex !== -1) {
        const next = [
          ...prev,
        ];

        next[existingIndex] = {
          ...next[existingIndex],

          quantity: Math.min(
            next[existingIndex].quantity +
              qty,
            product.stock
          ),
        };

        return next;
      }

      return [
        ...prev,
        {
          product,
          size,
          color,
          quantity: Math.min(
            Math.max(qty, 1),
            product.stock
          ),
        },
      ];
    });

    setCartDrawerOpen(true);

    return true;
  };

  /*
   * Remove product
   */
  const removeFromCart = (
    productId: string,
    size: string,
    color?: string
  ) => {
    setCart((prev) =>
      prev.filter((item) => {
        const sameProduct =
          item.product._id ===
          productId;

        const sameSize =
          item.size === size;

        const sameColor =
          color === undefined ||
          item.color === color;

        return !(
          sameProduct &&
          sameSize &&
          sameColor
        );
      })
    );
  };

  /*
   * Update quantity
   */
  const updateQuantity = (
    productId: string,
    size: string,
    qty: number,
    color?: string
  ) => {
    if (qty <= 0) {
      removeFromCart(
        productId,
        size,
        color
      );

      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        const matches =
          item.product._id ===
            productId &&
          item.size === size &&
          (color === undefined ||
            item.color === color);

        if (!matches) {
          return item;
        }

        return {
          ...item,
          quantity: Math.min(
            qty,
            item.product.stock
          ),
        };
      })
    );
  };

  /*
   * Clear cart
   */
  const clearCart = () => {
    setCart([]);

    localStorage.removeItem(
      'hangover_cart'
    );
  };

  /*
   * Subtotal
   */
  const subtotal =
    cart.reduce(
      (total, item) => {
        const price =
          item.product
            .discountPrice ??
          item.product.price;

        return (
          total +
          price *
            item.quantity
        );
      },
      0
    );

  /*
   * Total items
   */
  const totalItems =
    cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        totalItems,
        isCartDrawerOpen,
        setCartDrawerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart =
  (): CartContextType => {
    const context =
      useContext(
        CartContext
      );

    if (!context) {
      throw new Error(
        'useCart must be used inside CartProvider'
      );
    }

    return context;
  };
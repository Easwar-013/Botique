import React, {
  FC,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ChevronDown,
} from 'lucide-react';

import {
  AnimatePresence,
  motion,
} from 'framer-motion';

import {
  clsx,
} from 'clsx';

import {
  twMerge,
} from 'tailwind-merge';

function cn(
  ...inputs: unknown[]
) {
  return twMerge(
    clsx(inputs)
  );
}

/* =========================================================
   Button
========================================================= */

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'outline' | 'ghost' | 'link' | 'default';
  size?: 'sm' | 'lg' | 'icon' | 'default';
}

const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full text-sm font-medium',
          'transition-all duration-200',
          'focus-visible:outline-none',
          'disabled:pointer-events-none disabled:opacity-50',

          variant === 'outline' &&
            'border border-gray-200 bg-white text-gray-900 hover:border-black',

          variant === 'ghost' &&
            'bg-transparent hover:bg-gray-100',

          variant === 'link' &&
            'text-black underline-offset-4 hover:underline',

          variant === 'default' &&
            'bg-black text-white hover:bg-gray-800',

          size === 'sm' &&
            'h-9 px-3',

          size === 'lg' &&
            'h-11 px-8',

          size === 'icon' &&
            'h-10 w-10',

          size === 'default' &&
            'h-11 px-5',

          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

/* =========================================================
   Click Outside
========================================================= */

function useClickOutside(
  ref: React.RefObject<
    HTMLElement | null
  >,
  handler: () => void
) {
  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        ref.current &&
        !ref.current.contains(
          event.target as Node
        )
      ) {
        handler();
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, [ref, handler]);
}

/* =========================================================
   Types
========================================================= */

export interface DropdownItem {
  name: string;
  value: string;
}

interface AnimatedDropdownProps {
  items: DropdownItem[];
  value: string;
  onChange: (
    value: string
  ) => void;
  text?: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

/* =========================================================
   Animated Dropdown
========================================================= */

const AnimatedDropdown: React.FC<
  AnimatedDropdownProps
> = ({
  items,
  value,
  onChange,
  text = 'Select Option',
  className,
  align = 'right',
}) => {
  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const wrapperRef =
    useRef<HTMLDivElement>(null);

  useClickOutside(
    wrapperRef,
    () => setIsOpen(false)
  );

  const selectedItem =
    items.find(
      (item) =>
        item.value === value
    );

  const selectedText =
    selectedItem?.name ||
    text;

  const handleSelect = (
    itemValue: string
  ) => {
    onChange(itemValue);
    setIsOpen(false);
  };

  const alignmentClass =
    align === 'left'
      ? 'left-0'
      : align === 'center'
        ? 'left-1/2 -translate-x-1/2'
        : 'right-0';

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'relative inline-block',
        className
      )}
      data-state={
        isOpen
          ? 'open'
          : 'closed'
      }
    >
      {/* Trigger */}

      <Button
        type="button"
        variant="outline"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() =>
          setIsOpen(
            (current) => !current
          )
        }
        className="min-w-[190px] justify-between gap-4"
      >
        <span className="truncate">
          {selectedText}
        </span>

        <motion.div
          animate={{
            rotate: isOpen
              ? 180
              : 0,
          }}
          transition={{
            duration: 0.2,
            ease: 'easeInOut',
          }}
        >
          <ChevronDown
            size={17}
          />
        </motion.div>
      </Button>

      {/* Dropdown */}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="listbox"
            initial={{
              opacity: 0,
              y: -8,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -8,
              scale: 0.96,
            }}
            transition={{
              duration: 0.2,
              ease: 'easeOut',
            }}
            className={cn(
              'absolute top-[calc(100%+0.5rem)] z-50',
              alignmentClass,
              'min-w-[190px]',
              'overflow-hidden rounded-2xl',
              'border border-gray-200',
              'bg-white',
              'shadow-[0_12px_40px_rgba(0,0,0,0.10)]'
            )}
          >
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.035,
                  },
                },
              }}
            >
              {items.map(
                (
                  item
                ) => {
                  const active =
                    item.value ===
                    value;

                  return (
                    <motion.button
                      key={
                        item.value
                      }
                      type="button"
                      role="option"
                      aria-selected={
                        active
                      }
                      onClick={() =>
                        handleSelect(
                          item.value
                        )
                      }
                      variants={{
                        hidden: {
                          opacity: 0,
                          x: -10,
                        },
                        visible: {
                          opacity: 1,
                          x: 0,
                        },
                      }}
                      className={cn(
                        'flex w-full items-center justify-between',
                        'px-4 py-3',
                        'text-left text-sm',
                        'transition-colors duration-150',

                        active
                          ? 'bg-gray-100 font-medium text-black'
                          : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-black'
                      )}
                    >
                      <span>
                        {
                          item.name
                        }
                      </span>

                      {active && (
                        <span className="ml-4 h-1.5 w-1.5 rounded-full bg-black" />
                      )}
                    </motion.button>
                  );
                }
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedDropdown;
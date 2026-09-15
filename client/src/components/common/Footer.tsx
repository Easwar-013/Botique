import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">

        <div>
          <h2 className="text-xl font-semibold tracking-[0.22em]">
            BOUTIQUE
          </h2>

          <p className="mt-5 max-w-xs text-sm leading-7 text-gray-500">
            Contemporary fashion for those who create their
            own style.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">
            Shop
          </h3>

          <div className="mt-5 space-y-3 text-sm text-gray-500">
            <Link
              to="/shop"
              className="block transition hover:text-black"
            >
              All Products
            </Link>

            <Link
              to="/shop?filter=new"
              className="block transition hover:text-black"
            >
              New Arrivals
            </Link>

            <Link
              to="/shop?filter=offers"
              className="block transition hover:text-black"
            >
              Offers
            </Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">
            Customer Care
          </h3>

          <div className="mt-5 space-y-3 text-sm text-gray-500">
            <Link
              to="/contact"
              className="block transition hover:text-black"
            >
              Contact
            </Link>

            <Link
              to="/shipping"
              className="block transition hover:text-black"
            >
              Shipping
            </Link>

            <Link
              to="/returns"
              className="block transition hover:text-black"
            >
              Returns
            </Link>

            <Link
              to="/privacy"
              className="block transition hover:text-black"
            >
              Privacy
            </Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">
            Follow
          </h3>

          <div className="mt-5 space-y-3 text-sm text-gray-500">
            <a
              href="#"
              className="block transition hover:text-black"
            >
              Instagram
            </a>

            <a
              href="#"
              className="block transition hover:text-black"
            >
              Facebook
            </a>

            <a
              href="#"
              className="block transition hover:text-black"
            >
              Pinterest
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 px-6 py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} BOUTIQUE. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
import React from 'react';
import { Link } from 'react-router-dom';

interface ComingSoonProps {
  title: string;
  description?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({
  title,
  description = 'This section is ready for development.',
}) => {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
          BOUTIQUE
        </p>

        <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-6xl">
          {title}
        </h1>

        <p className="mt-5 text-gray-500">
          {description}
        </p>

        <Link
          to="/"
          className="mt-8 inline-block rounded-full bg-black px-7 py-3 text-sm text-white transition hover:bg-gray-800"
        >
          Back to Home
        </Link>
      </div>
    </section>
  );
};

export default ComingSoon;
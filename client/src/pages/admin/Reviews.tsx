import React, {
  useEffect,
  useState,
} from 'react';

import {
  Check,
  Star,
  Trash2,
  X,
} from 'lucide-react';

import api from '../../services/api';

interface Review {
  _id: string;
  product?: {
    name?: string;
  };
  user?: {
    name?: string;
    email?: string;
  };
  rating: number;
  title?: string;
  comment: string;
  isApproved?: boolean;
  createdAt: string;
}

const Reviews: React.FC = () => {
  const [reviews, setReviews] =
    useState<Review[]>([]);

  const [loading, setLoading] =
    useState(true);

  const loadReviews = async () => {
    try {
      setLoading(true);

      const response =
        await api.get('/reviews');

      setReviews(
        response.data.reviews || []
      );
    } catch (error) {
      console.error(
        'Load reviews error:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const updateApproval = async (
    id: string,
    approved: boolean
  ) => {
    try {
      await api.put(
        `/reviews/${id}`,
        {
          isApproved:
            approved,
        }
      );

      setReviews((prev) =>
        prev.map((review) =>
          review._id === id
            ? {
                ...review,
                isApproved:
                  approved,
              }
            : review
        )
      );
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          'Failed to update review.'
      );
    }
  };

  const deleteReview = async (
    id: string
  ) => {
    if (
      !window.confirm(
        'Delete this review?'
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/reviews/${id}`
      );

      setReviews((prev) =>
        prev.filter(
          (review) =>
            review._id !== id
        )
      );
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          'Failed to delete review.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div>
        <p className="text-sm text-gray-500">
          Customer Feedback
        </p>

        <h1 className="mt-1 text-3xl font-semibold">
          Reviews
        </h1>
      </div>

      <div className="mt-8 space-y-4">
        {loading ? (
          <div className="rounded-2xl border bg-white p-12 text-center text-gray-500">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border bg-white p-12 text-center text-gray-500">
            No reviews found.
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review._id}
              className="rounded-2xl border bg-white p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">

                <div>
                  <p className="font-semibold">
                    {review.product
                      ?.name ||
                      'Product'}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {review.user
                      ?.name ||
                      'Customer'}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {Array.from({
                    length: 5,
                  }).map(
                    (_, index) => (
                      <Star
                        key={index}
                        size={16}
                        className={
                          index <
                          review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }
                      />
                    )
                  )}
                </div>
              </div>

              {review.title && (
                <h3 className="mt-5 font-medium">
                  {review.title}
                </h3>
              )}

              <p className="mt-2 text-sm leading-7 text-gray-600">
                {review.comment}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t pt-5">
                <div className="text-xs text-gray-400">
                  {new Date(
                    review.createdAt
                  ).toLocaleDateString(
                    'en-IN'
                  )}
                </div>

                <div className="flex items-center gap-2">

                  {review.isApproved ? (
                    <button
                      type="button"
                      onClick={() =>
                        updateApproval(
                          review._id,
                          false
                        )
                      }
                      className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm"
                    >
                      <X
                        size={15}
                      />
                      Unapprove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        updateApproval(
                          review._id,
                          true
                        )
                      }
                      className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm text-white"
                    >
                      <Check
                        size={15}
                      />
                      Approve
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      deleteReview(
                        review._id
                      )
                    }
                    className="rounded-xl border p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2
                      size={16}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reviews;
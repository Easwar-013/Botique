import React, {
  useEffect,
  useState,
} from 'react';

import {
  Calendar,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

import api from '../../services/api';

interface Offer {
  _id: string;
  title: string;
  description?: string;
  discountType:
    | 'percentage'
    | 'fixed';
  discountValue: number;
  minPurchase?: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

interface OfferForm {
  title: string;
  description: string;
  discountType:
    | 'percentage'
    | 'fixed';
  discountValue: string;
  minPurchase: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

const initialForm: OfferForm = {
  title: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minPurchase: '',
  startsAt: '',
  endsAt: '',
  isActive: true,
};

const Offers: React.FC = () => {
  const [offers, setOffers] =
    useState<Offer[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<OfferForm>(
      initialForm
    );

  const loadOffers = async () => {
    try {
      setLoading(true);

      const response =
        await api.get('/offers');

      setOffers(
        response.data.offers || []
      );
    } catch (error) {
      console.error(
        'Load offers error:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  const submitOffer = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert(
        'Offer title is required.'
      );
      return;
    }

    if (
      !form.discountValue ||
      Number(form.discountValue) <= 0
    ) {
      alert(
        'Enter a valid discount.'
      );
      return;
    }

    const payload = {
      title:
        form.title.trim(),

      description:
        form.description.trim(),

      discountType:
        form.discountType,

      discountValue:
        Number(
          form.discountValue
        ),

      minPurchase:
        form.minPurchase
          ? Number(
              form.minPurchase
            )
          : 0,

      startsAt:
        form.startsAt,

      endsAt:
        form.endsAt,

      isActive:
        form.isActive,
    };

    setSaving(true);

    try {
      if (editingId) {
        await api.put(
          `/offers/${editingId}`,
          payload
        );
      } else {
        await api.post(
          '/offers',
          payload
        );
      }

      await loadOffers();

      resetForm();
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          'Failed to save offer.'
      );
    } finally {
      setSaving(false);
    }
  };

  const editOffer = (
    offer: Offer
  ) => {
    setEditingId(
      offer._id
    );

    setForm({
      title: offer.title,

      description:
        offer.description ||
        '',

      discountType:
        offer.discountType,

      discountValue:
        String(
          offer.discountValue
        ),

      minPurchase:
        String(
          offer.minPurchase ||
            ''
        ),

      startsAt:
        offer.startsAt
          ? offer.startsAt.slice(
              0,
              16
            )
          : '',

      endsAt:
        offer.endsAt
          ? offer.endsAt.slice(
              0,
              16
            )
          : '',

      isActive:
        offer.isActive,
    });

    setShowForm(true);
  };

  const deleteOffer = async (
    id: string
  ) => {
    if (
      !window.confirm(
        'Delete this offer?'
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/offers/${id}`
      );

      setOffers((prev) =>
        prev.filter(
          (offer) =>
            offer._id !== id
        )
      );
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          'Failed to delete offer.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            Marketing
          </p>

          <h1 className="mt-1 text-3xl font-semibold">
            Offers
          </h1>
        </div>

        <button
          type="button"
          onClick={() => {
            setForm(initialForm);
            setEditingId(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm text-white"
        >
          <Plus size={18} />
          Create Offer
        </button>
      </div>

      {showForm && (
        <div className="mt-8 rounded-2xl border bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {editingId
                ? 'Edit Offer'
                : 'Create Offer'}
            </h2>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg p-2 hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>

          <form
            onSubmit={submitOffer}
            className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            <input
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  title:
                    e.target.value,
                }))
              }
              placeholder="Summer Collection Sale"
              className="rounded-xl border px-4 py-3"
              required
            />

            <select
              value={
                form.discountType
              }
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  discountType:
                    e.target.value as
                      | 'percentage'
                      | 'fixed',
                }))
              }
              className="rounded-xl border bg-white px-4 py-3"
            >
              <option value="percentage">
                Percentage
              </option>

              <option value="fixed">
                Fixed Amount
              </option>
            </select>

            <input
              type="number"
              min="0"
              value={
                form.discountValue
              }
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  discountValue:
                    e.target.value,
                }))
              }
              placeholder="Discount"
              className="rounded-xl border px-4 py-3"
              required
            />

            <input
              type="number"
              min="0"
              value={
                form.minPurchase
              }
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  minPurchase:
                    e.target.value,
                }))
              }
              placeholder="Minimum Purchase"
              className="rounded-xl border px-4 py-3"
            />

            <input
              type="datetime-local"
              value={
                form.startsAt
              }
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  startsAt:
                    e.target.value,
                }))
              }
              className="rounded-xl border px-4 py-3"
              required
            />

            <input
              type="datetime-local"
              value={
                form.endsAt
              }
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  endsAt:
                    e.target.value,
                }))
              }
              className="rounded-xl border px-4 py-3"
              required
            />

            <textarea
              value={
                form.description
              }
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description:
                    e.target.value,
                }))
              }
              placeholder="Offer description"
              className="rounded-xl border px-4 py-3 sm:col-span-2 lg:col-span-3"
              rows={3}
            />

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={
                  form.isActive
                }
                onChange={() =>
                  setForm((prev) => ({
                    ...prev,
                    isActive:
                      !prev.isActive,
                  }))
                }
                className="h-5 w-5 accent-black"
              />

              Active
            </label>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-black px-5 py-3 text-white"
            >
              {saving
                ? 'Saving...'
                : editingId
                ? 'Update Offer'
                : 'Create Offer'}
            </button>
          </form>
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="text-sm text-gray-500">
            Loading offers...
          </div>
        ) : offers.length ===
          0 ? (
          <div className="col-span-full rounded-2xl border bg-white p-12 text-center text-gray-500">
            No offers created yet.
          </div>
        ) : (
          offers.map((offer) => (
            <div
              key={offer._id}
              className="rounded-2xl border bg-white p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">
                    {offer.title}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {offer.description}
                  </p>
                </div>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                  {offer.isActive
                    ? 'Active'
                    : 'Inactive'}
                </span>
              </div>

              <div className="mt-6 text-3xl font-light">
                {offer.discountType ===
                'percentage'
                  ? `${offer.discountValue}% OFF`
                  : `₹${offer.discountValue} OFF`}
              </div>

              <div className="mt-5 space-y-2 text-sm text-gray-500">
                <p className="flex items-center gap-2">
                  <Calendar size={15} />
                  {new Date(
                    offer.startsAt
                  ).toLocaleDateString(
                    'en-IN'
                  )}
                  {' - '}
                  {new Date(
                    offer.endsAt
                  ).toLocaleDateString(
                    'en-IN'
                  )}
                </p>

                {offer.minPurchase ? (
                  <p>
                    Minimum purchase: ₹
                    {offer.minPurchase.toLocaleString(
                      'en-IN'
                    )}
                  </p>
                ) : null}
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    editOffer(
                      offer
                    )
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm"
                >
                  <Pencil
                    size={15}
                  />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() =>
                    deleteOffer(
                      offer._id
                    )
                  }
                  className="rounded-xl border px-4 text-red-500 hover:bg-red-50"
                >
                  <Trash2
                    size={15}
                  />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Offers;
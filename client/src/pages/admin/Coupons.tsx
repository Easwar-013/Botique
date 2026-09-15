import React, {
  useEffect,
  useState,
} from 'react';

import {
  Pencil,
  Plus,
  Tag,
  Trash2,
  X,
} from 'lucide-react';

import api from '../../services/api';

interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage';
  discountValue: number;
  minimumPurchase?: number;
  expiresAt?: string;
  isActive: boolean;
}

interface CouponForm {
  code: string;
  discountValue: string;
  minimumPurchase: string;
  expiresAt: string;
  isActive: boolean;
}

const emptyForm: CouponForm = {
  code: '',
  discountValue: '',
  minimumPurchase: '',
  expiresAt: '',
  isActive: true,
};

const Coupons: React.FC = () => {
  const [coupons, setCoupons] =
    useState<Coupon[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [showForm, setShowForm] =
    useState(false);

  const [form, setForm] =
    useState<CouponForm>(
      emptyForm
    );

  /* =====================================================
     LOAD COUPONS
  ===================================================== */

  const loadCoupons = async () => {
    try {
      setLoading(true);

      const response =
        await api.get('/coupons');

      setCoupons(
        response.data?.coupons || []
      );
    } catch (error) {
      console.error(
        'Load coupons error:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  /* =====================================================
     RESET FORM
  ===================================================== */

  const resetForm = () => {
    setForm({
      ...emptyForm,
    });

    setEditingId(null);
    setShowForm(false);
  };

  /* =====================================================
     HANDLE FORM SUBMIT
  ===================================================== */

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!form.code.trim()) {
      alert(
        'Coupon code is required.'
      );
      return;
    }

    if (
      !form.discountValue ||
      Number(form.discountValue) <= 0
    ) {
      alert(
        'Enter a valid discount percentage.'
      );
      return;
    }

    if (
      Number(form.discountValue) > 100
    ) {
      alert(
        'Percentage discount cannot exceed 100%.'
      );
      return;
    }

    if (
      form.minimumPurchase &&
      Number(form.minimumPurchase) < 0
    ) {
      alert(
        'Minimum purchase cannot be negative.'
      );
      return;
    }

    setSaving(true);

    const payload = {
      code:
        form.code
          .trim()
          .toUpperCase(),

      discountType:
        'percentage',

      discountValue:
        Number(
          form.discountValue
        ),

      minimumPurchase:
        form.minimumPurchase
          ? Number(
              form.minimumPurchase
            )
          : undefined,

      expiresAt:
        form.expiresAt ||
        undefined,

      isActive:
        form.isActive,
    };

    try {
      if (editingId) {
        await api.put(
          `/coupons/${editingId}`,
          payload
        );
      } else {
        await api.post(
          '/coupons',
          payload
        );
      }

      await loadCoupons();

      resetForm();
    } catch (error: any) {
      alert(
        error?.response?.data
          ?.message ||
          'Failed to save coupon.'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     EDIT COUPON
  ===================================================== */

  const editCoupon = (
    coupon: Coupon
  ) => {
    setEditingId(
      coupon._id
    );

    setForm({
      code: coupon.code || '',

      discountValue:
        coupon.discountValue !==
        undefined
          ? String(
              coupon.discountValue
            )
          : '',

      minimumPurchase:
        coupon.minimumPurchase !==
          undefined &&
        coupon.minimumPurchase !==
          null
          ? String(
              coupon.minimumPurchase
            )
          : '',

      expiresAt:
        coupon.expiresAt
          ? coupon.expiresAt.slice(
              0,
              10
            )
          : '',

      isActive:
        coupon.isActive,
    });

    setShowForm(true);
  };

  /* =====================================================
     DELETE COUPON
  ===================================================== */

  const deleteCoupon = async (
    id: string
  ) => {
    if (
      !window.confirm(
        'Delete this coupon?'
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/coupons/${id}`
      );

      setCoupons((prev) =>
        prev.filter(
          (coupon) =>
            coupon._id !== id
        )
      );
    } catch (error: any) {
      alert(
        error?.response?.data
          ?.message ||
          'Failed to delete coupon.'
      );
    }
  };

  /* =====================================================
     OPEN CREATE FORM
  ===================================================== */

  const openCreateForm = () => {
    setForm({
      ...emptyForm,
    });

    setEditingId(null);
    setShowForm(true);
  };

  /* =====================================================
     RETURN
  ===================================================== */

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>
          <p className="text-sm text-gray-500">
            Promotions
          </p>

          <h1 className="mt-1 text-3xl font-semibold">
            Coupons
          </h1>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm text-white transition hover:bg-gray-800"
        >
          <Plus size={18} />
          Create Coupon
        </button>

      </div>

      {/* =================================================
          CREATE / EDIT FORM
      ================================================= */}

      {showForm && (
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <h2 className="text-xl font-semibold">
              {editingId
                ? 'Edit Coupon'
                : 'Create Coupon'}
            </h2>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg p-2 transition hover:bg-gray-100"
              aria-label="Close coupon form"
            >
              <X size={18} />
            </button>

          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 grid items-start gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3"
          >

            {/* =================================================
                COUPON CODE
            ================================================= */}

            <div className="self-start">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Coupon Code
              </label>

              <input
                value={form.code}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    code:
                      e.target.value.toUpperCase(),
                  }))
                }
                placeholder="BOUTIQUE10"
                className="h-12 w-full rounded-xl border border-gray-200 px-4 outline-none transition focus:border-black"
                required
              />

            </div>

            {/* =================================================
                DISCOUNT PERCENTAGE
            ================================================= */}

            <div className="self-start">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Discount Percentage
              </label>

              <div className="relative">

                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
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
                  placeholder="10"
                  className="h-12 w-full rounded-xl border border-gray-200 px-4 pr-10 outline-none transition focus:border-black"
                  required
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  %
                </span>

              </div>

              <p className="mt-1 text-xs text-gray-400">
                Maximum discount is 100%.
              </p>

            </div>

            {/* =================================================
                MINIMUM PURCHASE
            ================================================= */}

            <div className="self-start">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Minimum Purchase
                <span className="ml-1 text-xs font-normal text-gray-400">
                  Optional
                </span>
              </label>

              <div className="relative">

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  ₹
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.minimumPurchase
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      minimumPurchase:
                        e.target.value,
                    }))
                  }
                  placeholder="1000"
                  className="h-12 w-full rounded-xl border border-gray-200 py-3 pl-9 pr-4 outline-none transition focus:border-black"
                />

              </div>

              <p className="mt-1 text-xs text-gray-400">
                Leave empty to apply to all orders.
              </p>

            </div>

            {/* =================================================
                EXPIRY DATE
            ================================================= */}

            <div className="self-start">

              <label
                htmlFor="expiresAt"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Expiry Date
              </label>

              <input
                id="expiresAt"
                type="date"
                min={
                  new Date()
                    .toISOString()
                    .split('T')[0]
                }
                value={
                  form.expiresAt
                }
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    expiresAt:
                      e.target.value,
                  }))
                }
                className="h-12 w-full rounded-xl border border-gray-200 px-4 outline-none transition focus:border-black"
              />

            </div>

            {/* =================================================
                STATUS
            ================================================= */}

            <label className="mt-[26px] flex h-12 items-center gap-3 rounded-xl border border-gray-200 px-4">

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

              <span className="text-sm font-medium text-gray-700">
                Active
              </span>

            </label>

            {/* =================================================
                SUBMIT
            ================================================= */}

            <button
              type="submit"
              disabled={saving}
              className="mt-[26px] h-12 rounded-xl bg-black px-5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : editingId
                ? 'Update Coupon'
                : 'Create Coupon'}
            </button>

          </form>
        </div>
      )}

      {/* =================================================
          COUPON LIST
      ================================================= */}

      <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white">

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            Loading coupons...
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No coupons created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="border-b border-gray-100 bg-gray-50">

                <tr>

                  <th className="px-5 py-4 text-sm font-medium">
                    Code
                  </th>

                  <th className="px-5 py-4 text-sm font-medium">
                    Discount
                  </th>

                  <th className="px-5 py-4 text-sm font-medium">
                    Minimum Purchase
                  </th>

                  <th className="px-5 py-4 text-sm font-medium">
                    Expiry
                  </th>

                  <th className="px-5 py-4 text-sm font-medium">
                    Status
                  </th>

                  <th className="px-5 py-4 text-sm font-medium">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {coupons.map(
                  (coupon) => (
                    <tr
                      key={
                        coupon._id
                      }
                      className="border-b border-gray-100 last:border-0"
                    >

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2 font-medium">
                          <Tag size={16} />
                          {coupon.code}
                        </div>

                      </td>

                      <td className="px-5 py-4 text-sm font-medium">
                        {coupon.discountValue}%
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-500">
                        {coupon.minimumPurchase !==
                          undefined &&
                        coupon.minimumPurchase !==
                          null
                          ? `₹${coupon.minimumPurchase.toLocaleString(
                              'en-IN'
                            )}`
                          : 'No minimum'}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-500">
                        {coupon.expiresAt
                          ? new Date(
                              coupon.expiresAt
                            ).toLocaleDateString(
                              'en-IN'
                            )
                          : 'No expiry'}
                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            coupon.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {coupon.isActive
                            ? 'Active'
                            : 'Inactive'}
                        </span>

                      </td>

                      <td className="px-5 py-4">

                        <div className="flex gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              editCoupon(
                                coupon
                              )
                            }
                            className="rounded-lg p-2 transition hover:bg-gray-100"
                            aria-label="Edit coupon"
                          >
                            <Pencil
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteCoupon(
                                coupon._id
                              )
                            }
                            className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                            aria-label="Delete coupon"
                          >
                            <Trash2
                              size={16}
                            />
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
};

export default Coupons;
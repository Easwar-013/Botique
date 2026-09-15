import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Trash2,
} from 'lucide-react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import AnimatedDropdown from '../../components/ui/animated-dropdown';

import api from '../../services/api';

import type {
  Product,
} from '../../types';

interface FormState {
  name: string;
  description: string;
  brand: string;
  category: string;
  price: string;
  discountPercentage: string;
  stock: string;
  colors: string;
  tags: string;
  isNewArrival: boolean;
  isFeatured: boolean;
  isActive: boolean;
}

interface ExistingImage {
  url: string;
  publicId: string;
  isPrimary: boolean;
}

const SIZES = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'Free Size',
];

const CATEGORIES = [
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

const EditProduct: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [product, setProduct] =
    useState<Product | null>(null);

  const [form, setForm] =
    useState<FormState>({
      name: '',
      description: '',
      brand: 'Atelier',
      category: 'Women',
      price: '',
      discountPercentage: '',
      stock: '0',
      colors: '',
      tags: '',
      isNewArrival: false,
      isFeatured: false,
      isActive: true,
    });

  const [selectedSizes, setSelectedSizes] =
    useState<string[]>([]);

  const [images, setImages] =
    useState<ExistingImage[]>([]);

  /*
   * Calculate final price.
   */
  const calculatedDiscountPrice =
    useMemo(() => {
      const price = Number(
        form.price
      );

      const percentage =
        Number(
          form.discountPercentage
        );

      if (
        !Number.isFinite(price) ||
        price <= 0
      ) {
        return 0;
      }

      if (
        !Number.isFinite(
          percentage
        ) ||
        percentage <= 0
      ) {
        return price;
      }

      return Math.max(
        0,
        Number(
          (
            price -
            price *
              (percentage / 100)
          ).toFixed(2)
        )
      );
    }, [
      form.price,
      form.discountPercentage,
    ]);

  /*
   * Load product.
   */
  const loadProduct = async () => {
    if (!id) {
      return;
    }

    try {
      setLoading(true);

      const response =
        await api.get(
          `/products/${id}`
        );

      const data =
        response.data.product as Product;

      setProduct(data);

      /*
       * Convert existing
       * discountPrice into %
       */
      let discountPercentage = '';

      if (
        data.price > 0 &&
        data.discountPrice !==
          undefined &&
        data.discountPrice > 0 &&
        data.discountPrice <
          data.price
      ) {
        const percentage =
          (
            (
              data.price -
              data.discountPrice
            ) /
            data.price
          ) *
          100;

        discountPercentage =
          String(
            Math.round(
              percentage
            )
          );
      }

      setForm({
        name:
          data.name || '',

        description:
          data.description || '',

        brand:
          data.brand || '',

        category:
          data.category ||
          'Women',

        price:
          data.price !==
          undefined
            ? String(
                data.price
              )
            : '',

        discountPercentage,

        stock:
          data.stock !==
          undefined
            ? String(
                data.stock
              )
            : '0',

        colors:
          data.colors?.join(
            ', '
          ) || '',

        tags:
          data.tags?.join(
            ', '
          ) || '',

        isNewArrival:
          Boolean(
            data.isNewArrival
          ),

        isFeatured:
          Boolean(
            data.isFeatured
          ),

        isActive:
          Boolean(
            data.isActive
          ),
      });

      setSelectedSizes(
        data.sizes || []
      );

      setImages(
        data.images || []
      );
    } catch (error) {
      console.error(
        'Load product error:',
        error
      );

      alert(
        'Failed to load product.'
      );

      navigate(
        '/admin/products'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [id]);

  /*
   * Form change.
   */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement
    >
  ) => {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /*
   * Size toggle.
   */
  const toggleSize = (
    size: string
  ) => {
    setSelectedSizes(
      (prev) =>
        prev.includes(size)
          ? prev.filter(
              (item) =>
                item !== size
            )
          : [...prev, size]
    );
  };

  /*
   * Remove existing image.
   */
  const removeImage = (
    index: number
  ) => {
    setImages((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
    );
  };

  /*
   * Upload new images.
   */
  const uploadNewImages = async (
    files: FileList
  ) => {
    setUploading(true);

    try {
      const fileArray =
        Array.from(files);

      const uploaded =
        await Promise.all(
          fileArray.map(
            async (file) => {
              const formData =
                new FormData();

              formData.append(
                'image',
                file
              );

              const response =
                await api.post(
                  '/upload/image',
                  formData,
                  {
                    headers: {
                      'Content-Type':
                        'multipart/form-data',
                    },
                  }
                );

              return response.data
                .image as ExistingImage;
            }
          )
        );

      setImages((prev) => [
        ...prev,
        ...uploaded.map(
          (image) => ({
            ...image,
            isPrimary:
              prev.length ===
              0,
          })
        ),
      ]);
    } catch (error) {
      console.error(
        'Image upload error:',
        error
      );

      alert(
        'Failed to upload image.'
      );
    } finally {
      setUploading(false);
    }
  };

  /*
   * Save product.
   */
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!id) {
      return;
    }

    if (!form.name.trim()) {
      alert(
        'Product name is required.'
      );
      return;
    }

    const price = Number(
      form.price
    );

    const discountPercentage =
      Number(
        form.discountPercentage
      );

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      alert(
        'Please enter a valid price.'
      );
      return;
    }

    if (
      form.discountPercentage &&
      (
        !Number.isFinite(
          discountPercentage
        ) ||
        discountPercentage < 0 ||
        discountPercentage > 100
      )
    ) {
      alert(
        'Discount percentage must be between 0 and 100.'
      );
      return;
    }

    if (
      Number(form.stock) < 0
    ) {
      alert(
        'Stock cannot be negative.'
      );
      return;
    }

    if (
      selectedSizes.length === 0
    ) {
      alert(
        'Select at least one size.'
      );
      return;
    }

    if (
      images.length === 0
    ) {
      alert(
        'At least one product image is required.'
      );
      return;
    }

    setSaving(true);

    try {
      const colors =
        form.colors
          .split(',')
          .map((color) =>
            color.trim()
          )
          .filter(Boolean);

      const tags =
        form.tags
          .split(',')
          .map((tag) =>
            tag.trim()
          )
          .filter(Boolean);

      const hasDiscount =
        Number.isFinite(
          discountPercentage
        ) &&
        discountPercentage > 0;

      await api.put(
        `/products/${id}`,
        {
          name:
            form.name.trim(),

          description:
            form.description.trim(),

          brand:
            form.brand.trim(),

          category:
            form.category,

          price,

          /*
           * Convert percentage
           * back into database
           * discountPrice.
           */
          discountPrice:
            hasDiscount
              ? calculatedDiscountPrice
              : undefined,

          stock:
            Number(form.stock),

          sizes:
            selectedSizes,

          colors,

          tags,

          images:
            images.map(
              (
                image,
                index
              ) => ({
                ...image,
                isPrimary:
                  index === 0,
              })
            ),

          isNewArrival:
            form.isNewArrival,

          isFeatured:
            form.isFeatured,

          isActive:
            form.isActive,
        }
      );

      alert(
        'Product updated successfully.'
      );

      navigate(
        '/admin/products'
      );
    } catch (error: any) {
      console.error(
        'Update product error:',
        error
      );

      alert(
        error?.response?.data
          ?.message ||
          'Failed to update product.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2
          size={30}
          className="animate-spin text-gray-400"
        />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            type="button"
            onClick={() =>
              navigate(
                '/admin/products'
              )
            }
            className="flex h-11 w-11 items-center justify-center rounded-full border bg-white transition hover:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <p className="text-sm text-gray-500">
              Admin / Products / Edit
            </p>

            <h1 className="mt-1 text-3xl font-semibold">
              Edit Product
            </h1>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[1fr_360px]"
        >

          {/* ================================================= */}
          {/* MAIN */}
          {/* ================================================= */}
          <div className="space-y-6">

            {/* Product Information */}
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">
                Product Information
              </h2>

              <div className="mt-6 space-y-5">

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Product Name
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Brand
                  </label>

                  <input
                    name="brand"
                    value={form.brand}
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Category
                  </label>

                  <AnimatedDropdown
                    items={CATEGORIES.map(
                      (category) => ({
                        name: category,
                        value: category,
                      })
                    )}
                    value={form.category}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        category: value,
                      }))
                    }
                    text="Select Category"
                    align="left"
                    className="w-full [&>button]:w-full [&>button]:min-w-0"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Description
                  </label>

                  <textarea
                    name="description"
                    rows={5}
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full resize-none rounded-xl border px-4 py-3 outline-none focus:border-black"
                  />
                </div>
              </div>
            </section>

            {/* Pricing */}
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">
                Pricing & Inventory
              </h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-3">

                {/* Price */}
                <div>
                  <label
                    htmlFor="price"
                    className="mb-2 block text-sm font-medium"
                  >
                    Price (₹)
                  </label>

                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={
                      handleChange
                    }
                    placeholder="1999"
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                    required
                  />
                </div>

                {/* Discount percentage */}
                <div>
                  <label
                    htmlFor="discountPercentage"
                    className="mb-2 block text-sm font-medium"
                  >
                    Discount (%)
                  </label>

                  <div className="relative">
                    <input
                      id="discountPercentage"
                      name="discountPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={
                        form.discountPercentage
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="25"
                      className="w-full rounded-xl border px-4 py-3 pr-10 outline-none focus:border-black"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      %
                    </span>
                  </div>

                  {form.discountPercentage &&
                    calculatedDiscountPrice <
                      Number(
                        form.price
                      ) && (
                      <p className="mt-2 text-xs text-gray-500">
                        Final price:{' '}
                        <span className="font-medium text-black">
                          ₹
                          {calculatedDiscountPrice.toLocaleString(
                            'en-IN',
                            {
                              maximumFractionDigits: 2,
                            }
                          )}
                        </span>
                      </p>
                    )}
                </div>

                {/* Stock */}
                <div>
                  <label
                    htmlFor="stock"
                    className="mb-2 block text-sm font-medium"
                  >
                    Stock
                  </label>

                  <input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    value={
                      form.stock
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="10"
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                    required
                  />
                </div>
              </div>
            </section>

            {/* Sizes */}
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">
                Sizes
              </h2>

              <div className="mt-5 flex flex-wrap gap-3">
                {SIZES.map(
                  (size) => {
                    const selected =
                      selectedSizes.includes(
                        size
                      );

                    return (
                      <button
                        type="button"
                        key={size}
                        onClick={() =>
                          toggleSize(
                            size
                          )
                        }
                        className={`rounded-xl border px-5 py-3 text-sm ${
                          selected
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 hover:border-black'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  }
                )}
              </div>
            </section>

            {/* Colors */}
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">
                Colors
              </h2>

              <input
                name="colors"
                value={form.colors}
                onChange={
                  handleChange
                }
                placeholder="Black, White, Navy Blue"
                className="mt-5 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              />
            </section>

            {/* Tags */}
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">
                Tags
              </h2>

              <input
                name="tags"
                value={form.tags}
                onChange={
                  handleChange
                }
                placeholder="summer, new, trending"
                className="mt-5 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              />
            </section>
          </div>

          {/* ================================================= */}
          {/* SIDEBAR */}
          {/* ================================================= */}
          <div className="space-y-6">

            {/* Images */}
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">
                Product Images
              </h2>

              <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 text-center transition hover:border-black hover:bg-gray-50">
                {uploading ? (
                  <Loader2
                    size={30}
                    className="animate-spin"
                  />
                ) : (
                  <ImagePlus
                    size={30}
                  />
                )}

                <p className="mt-3 text-sm font-medium">
                  Add more images
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  JPG, PNG or WEBP
                </p>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={
                    uploading
                  }
                  onChange={(e) => {
                    if (
                      e.target.files
                    ) {
                      uploadNewImages(
                        e.target.files
                      );
                    }
                  }}
                  className="hidden"
                />
              </label>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {images.map(
                  (
                    image,
                    index
                  ) => (
                    <div
                      key={
                        image.publicId ||
                        `${image.url}-${index}`
                      }
                      className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100"
                    >
                      <img
                        src={
                          image.url.startsWith(
                            'http'
                          )
                            ? image.url
                            : `${
                                import.meta
                                  .env
                                  .VITE_SERVER_URL ||
                                'http://localhost:5000'
                              }${image.url}`
                        }
                        alt={`Product ${
                          index + 1
                        }`}
                        className="h-full w-full object-cover"
                      />

                      {index ===
                        0 && (
                        <span className="absolute left-2 top-2 rounded-full bg-black px-2 py-1 text-[10px] text-white">
                          Primary
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          removeImage(
                            index
                          )
                        }
                        className="absolute right-2 top-2 rounded-full bg-white p-2 text-red-500 opacity-0 shadow transition group-hover:opacity-100"
                        aria-label="Remove image"
                      >
                        <Trash2
                          size={15}
                        />
                      </button>
                    </div>
                  )
                )}
              </div>
            </section>

            {/* Status */}
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">
                Status
              </h2>

              <div className="mt-5 space-y-4">

                <label className="flex cursor-pointer justify-between">
                  <span>
                    New Arrival
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      form.isNewArrival
                    }
                    onChange={() =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          isNewArrival:
                            !prev.isNewArrival,
                        })
                      )
                    }
                    className="h-5 w-5 accent-black"
                  />
                </label>

                <label className="flex cursor-pointer justify-between">
                  <span>
                    Featured
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      form.isFeatured
                    }
                    onChange={() =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          isFeatured:
                            !prev.isFeatured,
                        })
                      )
                    }
                    className="h-5 w-5 accent-black"
                  />
                </label>

                <label className="flex cursor-pointer justify-between">
                  <span>
                    Active
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      form.isActive
                    }
                    onChange={() =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          isActive:
                            !prev.isActive,
                        })
                      )
                    }
                    className="h-5 w-5 accent-black"
                  />
                </label>
              </div>
            </section>

            {/* Actions */}
            <section className="rounded-2xl border bg-white p-6">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/admin/products'
                  )
                }
                className="w-full rounded-xl border py-3 transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                {saving && (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                )}

                {saving
                  ? 'Saving...'
                  : 'Save Changes'}
              </button>
            </section>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
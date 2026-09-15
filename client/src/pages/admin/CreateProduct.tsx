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
  Upload,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import AnimatedDropdown from '../../components/ui/animated-dropdown';

import api from '../../services/api';

import {
  compressImageIfNeeded,
  formatFileSize,
} from '../../utils/compressImage';

interface ProductForm {
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
}

interface UploadResultImage {
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

const CreateProduct: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(false);

  const [processingImages, setProcessingImages] =
    useState(false);

  const [uploadingImages, setUploadingImages] =
    useState(false);

  const [form, setForm] =
    useState<ProductForm>({
      name: '',
      description: '',
      brand: 'Atelier',
      category: 'Women',
      price: '',
      discountPercentage: '',
      stock: '10',
      colors: '',
      tags: '',
      isNewArrival: true,
      isFeatured: false,
    });

  const [selectedSizes, setSelectedSizes] =
    useState<string[]>([
      'XS',
      'S',
      'M',
      'L',
      'XL',
    ]);

  const [files, setFiles] =
    useState<File[]>([]);

  const [previews, setPreviews] =
    useState<string[]>([]);

  const [compressionInfo, setCompressionInfo] =
    useState<
      {
        name: string;
        originalSize: number;
        finalSize: number;
        compressed: boolean;
      }[]
    >([]);

  /*
   * Calculate final price.
   */
  const calculatedDiscountPrice =
    useMemo(() => {
      const price = Number(form.price);
      const percentage = Number(
        form.discountPercentage
      );

      if (
        !Number.isFinite(price) ||
        price <= 0 ||
        !Number.isFinite(percentage) ||
        percentage <= 0
      ) {
        return price > 0 ? price : 0;
      }

      const discountAmount =
        price * (percentage / 100);

      return Math.max(
        0,
        Number(
          (price - discountAmount).toFixed(2)
        )
      );
    }, [
      form.price,
      form.discountPercentage,
    ]);

  /*
   * Image previews.
   */
  useEffect(() => {
    const urls = files.map((file) =>
      URL.createObjectURL(file)
    );

    setPreviews(urls);

    return () => {
      urls.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, [files]);

  /*
   * Input changes.
   */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /*
   * Status toggles.
   */
  const toggleStatus = (
    field:
      | 'isNewArrival'
      | 'isFeatured'
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  /*
   * Size selection.
   */
  const toggleSize = (
    size: string
  ) => {
    setSelectedSizes((prev) =>
      prev.includes(size)
        ? prev.filter(
            (item) => item !== size
          )
        : [...prev, size]
    );
  };

  /*
   * Image selection + compression.
   */
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = Array.from(
      e.target.files || []
    );

    if (
      selectedFiles.length === 0
    ) {
      return;
    }

    const validFiles =
      selectedFiles.filter((file) => {
        if (
          !file.type.startsWith('image/')
        ) {
          alert(
            `${file.name} is not an image.`
          );

          return false;
        }

        if (
          file.size >
          20 * 1024 * 1024
        ) {
          alert(
            `${file.name} is larger than 20 MB.`
          );

          return false;
        }

        return true;
      });

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    setProcessingImages(true);

    try {
      const results =
        await Promise.all(
          validFiles.map(
            async (file) => {
              const result =
                await compressImageIfNeeded(
                  file
                );

              return {
                original: file,
                result,
              };
            }
          )
        );

      setFiles(
        results.map(
          ({ result }) =>
            result.file
        )
      );

      setCompressionInfo(
        results.map(
          ({
            original,
            result,
          }) => ({
            name: original.name,
            originalSize:
              result.originalSize,
            finalSize:
              result.finalSize,
            compressed:
              result.compressed,
          })
        )
      );
    } catch (error) {
      console.error(
        'Image processing failed:',
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : 'Unable to process images.'
      );
    } finally {
      setProcessingImages(false);
      e.target.value = '';
    }
  };

  /*
   * Remove image.
   */
  const removeFile = (
    index: number
  ) => {
    setFiles((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
    );

    setCompressionInfo((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
    );
  };

  /*
   * Upload images.
   */
  const uploadImages = async (): Promise<
    UploadResultImage[]
  > => {
    if (files.length === 0) {
      return [];
    }

    setUploadingImages(true);

    try {
      const uploaded =
        await Promise.all(
          files.map(
            async (
              file,
              index
            ) => {
              if (
                file.size >
                100 * 1024
              ) {
                throw new Error(
                  `${file.name} is still larger than 100 KB.`
                );
              }

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

              return {
                url:
                  response.data
                    .image.url,

                publicId:
                  response.data
                    .image.publicId,

                isPrimary:
                  index === 0,
              };
            }
          )
        );

      return uploaded;
    } finally {
      setUploadingImages(false);
    }
  };

  /*
   * Submit.
   */
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert(
        'Please enter a product name.'
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
        'Please select at least one size.'
      );
      return;
    }

    if (
      files.length === 0
    ) {
      alert(
        'Please upload at least one product image.'
      );
      return;
    }

    setLoading(true);

    try {
      const images =
        await uploadImages();

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

      const payload = {
        name: form.name.trim(),

        description:
          form.description.trim(),

        brand: form.brand.trim(),

        category: form.category,

        price,

        /*
         * Database still receives
         * discountPrice.
         */
        discountPrice:
          hasDiscount
            ? calculatedDiscountPrice
            : undefined,

        stock: Number(
          form.stock
        ),

        sizes: selectedSizes,

        colors,

        tags,

        images,

        isNewArrival:
          form.isNewArrival,

        isFeatured:
          form.isFeatured,

        isActive: true,
      };

      await api.post(
        '/products',
        payload
      );

      alert(
        'Product created successfully.'
      );

      navigate(
        '/admin/products'
      );
    } catch (error: unknown) {
      console.error(
        'Create product error:',
        error
      );

      const message =
        (
          error as {
            response?: {
              data?: {
                message?: string;
              };
            };
          }
        )?.response?.data
          ?.message ||
        (error instanceof Error
          ? error.message
          : 'Error creating product.');

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
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
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white transition hover:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <p className="text-sm text-gray-500">
              Admin / Products
            </p>

            <h1 className="mt-1 text-3xl font-semibold text-gray-900">
              Create Product
            </h1>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

            {/* ================================================= */}
            {/* MAIN */}
            {/* ================================================= */}
            <div className="space-y-6">

              {/* Product information */}
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">
                  Product Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add the basic information for your product.
                </p>

                <div className="mt-6 space-y-5">

                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Product Name
                    </label>

                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={
                        handleChange
                      }
                      placeholder="Example: Oversized Linen Shirt"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="brand"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Brand
                    </label>

                    <input
                      id="brand"
                      name="brand"
                      type="text"
                      value={form.brand}
                      onChange={
                        handleChange
                      }
                      placeholder="Atelier"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
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
                    <div className="mb-2 flex items-center justify-between">
                      <label
                        htmlFor="description"
                        className="text-sm font-medium text-gray-700"
                      >
                        Description
                      </label>

                      <span className="text-xs text-gray-400">
                        Optional
                      </span>
                    </div>

                    <textarea
                      id="description"
                      name="description"
                      rows={5}
                      value={
                        form.description
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Describe the fabric, fit, style, material, etc."
                      className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
                    />
                  </div>
                </div>
              </section>

              {/* Pricing */}
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">
                  Pricing & Inventory
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Set the price, discount and available stock.
                </p>

                <div className="mt-6 grid gap-5 sm:grid-cols-3">

                  {/* Price */}
                  <div>
                    <label
                      htmlFor="price"
                      className="mb-2 block text-sm font-medium text-gray-700"
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
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                      required
                    />
                  </div>

                  {/* Discount Percentage */}
                  <div>
                    <label
                      htmlFor="discountPercentage"
                      className="mb-2 block text-sm font-medium text-gray-700"
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
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-10 outline-none focus:border-black"
                      />

                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        %
                      </span>
                    </div>

                    {form.discountPercentage &&
                      Number(form.price) > 0 &&
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
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Stock
                    </label>

                    <input
                      id="stock"
                      name="stock"
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Sizes */}
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">
                  Sizes
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Select all sizes available for this product.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {SIZES.map(
                    (size) => {
                      const selected =
                        selectedSizes.includes(
                          size
                        );

                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() =>
                            toggleSize(
                              size
                            )
                          }
                          className={`rounded-xl border px-5 py-3 text-sm font-medium transition ${
                            selected
                              ? 'border-black bg-black text-white'
                              : 'border-gray-200 bg-white hover:border-black'
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
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Colors
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Type the colors available for this product.
                    </p>
                  </div>

                  <span className="text-xs text-gray-400">
                    Optional
                  </span>
                </div>

                <input
                  id="colors"
                  name="colors"
                  type="text"
                  value={form.colors}
                  onChange={handleChange}
                  placeholder="Black, White, Navy Blue, Beige"
                  className="mt-6 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Separate multiple colors with commas.
                </p>

                {form.colors.trim() && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {form.colors
                      .split(',')
                      .map((color) =>
                        color.trim()
                      )
                      .filter(Boolean)
                      .map((color) => (
                        <span
                          key={color}
                          className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700"
                        >
                          {color}
                        </span>
                      ))}
                  </div>
                )}
              </section>

              {/* Tags */}
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Tags
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Add search or discovery tags.
                    </p>
                  </div>

                  <span className="text-xs text-gray-400">
                    Optional
                  </span>
                </div>

                <input
                  id="tags"
                  name="tags"
                  type="text"
                  value={form.tags}
                  onChange={handleChange}
                  placeholder="new, summer, trending"
                  className="mt-6 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Separate tags with commas.
                </p>
              </section>
            </div>

            {/* ================================================= */}
            {/* SIDEBAR */}
            {/* ================================================= */}
            <div className="space-y-6">

              {/* Images */}
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">
                  Product Images
                </h2>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Upload photos directly from your computer.
                  Images above 100 KB are compressed before
                  upload.
                </p>

                <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-7 text-center transition hover:border-black hover:bg-gray-50">
                  {processingImages ? (
                    <Loader2
                      size={32}
                      className="animate-spin text-gray-400"
                    />
                  ) : (
                    <ImagePlus
                      size={32}
                      className="text-gray-400"
                    />
                  )}

                  <p className="mt-4 text-sm font-medium text-gray-800">
                    {processingImages
                      ? 'Compressing images...'
                      : 'Click to upload images'}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    JPG, PNG or WEBP
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Maximum 20 MB per selected image
                  </p>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={
                      processingImages
                    }
                    onChange={
                      handleFileChange
                    }
                    className="hidden"
                  />
                </label>

                {compressionInfo.length >
                  0 && (
                  <div className="mt-5 space-y-2">
                    {compressionInfo.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={`${item.name}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-gray-800">
                              {item.name}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              {formatFileSize(
                                item.originalSize
                              )}{' '}
                              →{' '}
                              {formatFileSize(
                                item.finalSize
                              )}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                              item.finalSize <=
                              100 * 1024
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {item.finalSize <=
                            100 * 1024
                              ? 'Ready'
                              : 'Too large'}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}

                {previews.length >
                  0 && (
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {previews.map(
                      (
                        preview,
                        index
                      ) => (
                        <div
                          key={preview}
                          className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100"
                        >
                          <img
                            src={preview}
                            alt={`Product preview ${
                              index + 1
                            }`}
                            className="h-full w-full object-cover"
                          />

                          {index ===
                            0 && (
                            <span className="absolute left-2 top-2 rounded-full bg-black px-2.5 py-1 text-[10px] text-white">
                              Primary
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              removeFile(
                                index
                              )
                            }
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-500 opacity-0 shadow transition group-hover:opacity-100"
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
                )}
              </section>

              {/* Status */}
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">
                  Product Status
                </h2>

                <div className="mt-6 space-y-5">

                  <label className="flex cursor-pointer items-center justify-between gap-5">
                    <div>
                      <p className="text-sm font-medium">
                        New Arrival
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Show the product in New Arrivals.
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={
                        form.isNewArrival
                      }
                      onChange={() =>
                        toggleStatus(
                          'isNewArrival'
                        )
                      }
                      className="h-5 w-5 accent-black"
                    />
                  </label>

                  <label className="flex cursor-pointer items-center justify-between gap-5">
                    <div>
                      <p className="text-sm font-medium">
                        Featured
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Show in featured collections.
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={
                        form.isFeatured
                      }
                      onChange={() =>
                        toggleStatus(
                          'isFeatured'
                        )
                      }
                      className="h-5 w-5 accent-black"
                    />
                  </label>
                </div>
              </section>

              {/* Actions */}
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      '/admin/products'
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    processingImages ||
                    uploadingImages
                  }
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3.5 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processingImages ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Compressing...
                    </>
                  ) : uploadingImages ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Uploading...
                    </>
                  ) : loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Upload size={17} />
                      Create Product
                    </>
                  )}
                </button>
              </section>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;
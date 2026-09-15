import React, { useEffect, useState } from 'react';
import {
  Edit3,
  Package,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  Link,
} from 'react-router-dom';

import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';

interface Product {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number;
  stock: number;
  category: string;
  images?: {
    url: string;
    publicId: string;
    isPrimary: boolean;
  }[];
}

const Products: React.FC = () => {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        '/products',
        {
          params: {
            page: 1,
            limit: 100,
          },
        }
      );

      setProducts(
        response.data.products || []
      );
    } catch (error) {
      console.error(
        'Failed to load products:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const deleteProduct = async (
    id: string
  ) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this product?'
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      await api.delete(
        `/products/${id}`
      );

      setProducts((prev) =>
        prev.filter(
          (product) =>
            product._id !== id
        )
      );
    } catch (error: any) {
      console.error(
        'Delete product error:',
        error
      );

      alert(
        error?.response?.data?.message ||
          'Failed to delete product.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            Catalogue
          </p>

          <h1 className="mt-1 text-3xl font-semibold text-gray-900">
            Products
          </h1>
        </div>

        <Link
          to="/admin/products/create"
          className="flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <Plus size={18} />
          Add Product
        </Link>
      </div>

      {/* Table */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <Package
              size={40}
              className="text-gray-300"
            />

            <h2 className="mt-4 text-xl font-medium">
              No products yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Start building your collection.
            </p>

            <Link
              to="/admin/products/create"
              className="mt-6 rounded-xl bg-black px-5 py-3 text-sm text-white"
            >
              Add Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-5 py-4 text-sm font-semibold">
                    Product
                  </th>

                  <th className="px-5 py-4 text-sm font-semibold">
                    Category
                  </th>

                  <th className="px-5 py-4 text-sm font-semibold">
                    Price
                  </th>

                  <th className="px-5 py-4 text-sm font-semibold">
                    Stock
                  </th>

                  <th className="px-5 py-4 text-sm font-semibold">
                    Status
                  </th>

                  <th className="px-5 py-4 text-sm font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => {
                  const image =
                    product.images?.find(
                      (item) =>
                        item.isPrimary
                    )?.url ||
                    product.images?.[0]
                      ?.url;

                  const finalPrice =
                    product.discountPrice ??
                    product.price;

                  return (
                    <tr
                      key={product._id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      {/* Product + Image */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-14 overflow-hidden rounded-xl bg-gray-100">
                            {image ? (
                              <img
                                src={getImageUrl(
                                  image
                                )}
                                alt={
                                  product.name
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-gray-300">
                                <Package
                                  size={20}
                                />
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="font-medium text-gray-900">
                              {product.name}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              ID: {product._id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {product.category}
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium">
                          ₹
                          {finalPrice.toLocaleString(
                            'en-IN'
                          )}
                        </div>

                        {product.discountPrice && (
                          <div className="text-xs text-gray-400 line-through">
                            ₹
                            {product.price.toLocaleString(
                              'en-IN'
                            )}
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            product.stock === 0
                              ? 'bg-red-100 text-red-700'
                              : product.stock <= 5
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {product.stock ===
                          0
                            ? 'Out of stock'
                            : `${product.stock} available`}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
                          Active
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/admin/products/${product._id}/edit`}
                            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-black"
                            title="Edit"
                          >
                            <Edit3
                              size={17}
                            />
                          </Link>

                          <button
                            type="button"
                            disabled={
                              deletingId ===
                              product._id
                            }
                            onClick={() =>
                              deleteProduct(
                                product._id
                              )
                            }
                            className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-40"
                            title="Delete"
                          >
                            <Trash2
                              size={17}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
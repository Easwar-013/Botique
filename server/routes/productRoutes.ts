import {
  Router,
  type Request,
  type Response,
} from 'express';

import mongoose from 'mongoose';

import Product from '../models/Product';

import {
  protect,
  requireAdmin,
} from '../middleware/auth';

const router = Router();

/**
 * Escape user input before putting it into RegExp.
 */
const escapeRegex = (
  value: string
): string => {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
};

/**
 * Generate a URL-safe slug.
 */
const createBaseSlug = (
  name: string
): string => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Generate a unique slug.
 */
const generateUniqueSlug = async (
  name: string
): Promise<string> => {
  const baseSlug =
    createBaseSlug(name) ||
    'product';

  let slug = baseSlug;
  let counter = 1;

  while (
    await Product.exists({
      slug,
    })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

/**
 * Generate a unique SKU.
 */
const generateUniqueSku =
  async (): Promise<string> => {
    let sku = '';

    do {
      const randomNumber =
        Math.floor(
          1000 +
            Math.random() * 9000
        );

      sku = `HO-${Date.now()}-${randomNumber}`;
    } while (
      await Product.exists({
        sku,
      })
    );

    return sku;
  };

/**
 * GET /api/products
 *
 * Public product listing.
 *
 * Supports:
 * search
 * category
 * minPrice
 * maxPrice
 * sort
 * page
 * limit
 */
router.get(
  '/',
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const {
        search = '',
        category,
        minPrice,
        maxPrice,
        sort = 'newest',
        page = '1',
        limit = '12',
      } = req.query;

      const currentPage =
        Math.max(
          Number(page) || 1,
          1
        );

      const perPage =
        Math.min(
          Math.max(
            Number(limit) || 12,
            1
          ),
          100
        );

      /**
       * Customer-facing products should
       * only show active products.
       */
      const filter: Record<
        string,
        unknown
      > = {
        isActive: true,
      };

      // --------------------------------
      // Search - keyword based
      // --------------------------------
      if (
        typeof search === 'string' &&
        search.trim()
      ) {
        /*
         * Example:
         *
         * "orange shirt"
         *
         * becomes:
         *
         * ["orange", "shirt"]
         *
         * Each keyword must match somewhere
         * in the product.
         */
        const keywords =
          search
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean);

        /*
         * Remove duplicate keywords.
         *
         * Example:
         * "orange orange shirt"
         *
         * becomes:
         * ["orange", "shirt"]
         */
        const uniqueKeywords = [
          ...new Set(keywords),
        ];

        /*
         * Every keyword must match at least
         * one searchable product field.
         *
         * Example product:
         *
         * Orange Double Pocket Shirt
         *
         * Search:
         * "orange shirt"
         *
         * orange -> matches name
         * shirt  -> matches name
         *
         * Product is returned.
         */
        const keywordConditions =
          uniqueKeywords.map(
            (keyword) => {
              const keywordRegex =
                new RegExp(
                  escapeRegex(
                    keyword
                  ),
                  'i'
                );

              return {
                $or: [
                  {
                    name: {
                      $regex:
                        keywordRegex,
                    },
                  },

                  {
                    description: {
                      $regex:
                        keywordRegex,
                    },
                  },

                  {
                    brand: {
                      $regex:
                        keywordRegex,
                    },
                  },

                  {
                    sku: {
                      $regex:
                        keywordRegex,
                    },
                  },

                  {
                    category: {
                      $regex:
                        keywordRegex,
                    },
                  },

                  {
                    tags: {
                      $regex:
                        keywordRegex,
                    },
                  },
                ],
              };
            }
          );

        /*
         * Require ALL keywords to match.
         *
         * This gives us:
         *
         * "orange shirt"
         *
         * AND
         *
         * "shirt orange"
         *
         * both work.
         */
        if (
          keywordConditions.length >
          0
        ) {
          filter.$and =
            keywordConditions;
        }
      }

      // --------------------------------
      // Category
      // --------------------------------
      if (
        typeof category ===
          'string' &&
        category.trim()
      ) {
        filter.category =
          category.trim();
      }

      // --------------------------------
      // Price
      // --------------------------------
      if (
        minPrice !== undefined ||
        maxPrice !== undefined
      ) {
        const priceFilter: Record<
          string,
          number
        > = {};

        if (
          minPrice !== undefined
        ) {
          const value =
            Number(minPrice);

          if (
            Number.isFinite(value)
          ) {
            priceFilter.$gte =
              value;
          }
        }

        if (
          maxPrice !== undefined
        ) {
          const value =
            Number(maxPrice);

          if (
            Number.isFinite(value)
          ) {
            priceFilter.$lte =
              value;
          }
        }

        if (
          Object.keys(
            priceFilter
          ).length > 0
        ) {
          filter.price =
            priceFilter;
        }
      }

      // --------------------------------
      // Sorting
      // --------------------------------
      let sortOption: Record<
        string,
        1 | -1
      >;

      switch (sort) {
        case 'price-low':
          sortOption = {
            price: 1,
          };
          break;

        case 'price-high':
          sortOption = {
            price: -1,
          };
          break;

        case 'name-asc':
          sortOption = {
            name: 1,
          };
          break;

        case 'name-desc':
          sortOption = {
            name: -1,
          };
          break;

        case 'oldest':
          sortOption = {
            createdAt: 1,
          };
          break;

        case 'newest':
        default:
          sortOption = {
            createdAt: -1,
          };
          break;
      }

      const skip =
        (currentPage - 1) *
        perPage;

      const [
        products,
        total,
      ] = await Promise.all([
        Product.find(filter)
          .sort(sortOption)
          .skip(skip)
          .limit(perPage)
          .lean(),

        Product.countDocuments(
          filter
        ),
      ]);

      res.status(200).json({
        success: true,

        products,

        pagination: {
          page: currentPage,
          limit: perPage,
          total,
          pages: Math.ceil(
            total / perPage
          ),
        },
      });
    } catch (error) {
      console.error(
        'Get products error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to fetch products.',
      });
    }
  }
);

/**
 * GET /api/products/:id
 *
 * Get a single active product.
 */
router.get(
  '/:id',
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const id = String(
        req.params.id
      );

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        res.status(400).json({
          success: false,
          message:
            'Invalid product ID.',
        });

        return;
      }

      const product =
        await Product.findOne({
          _id: id,
          isActive: true,
        }).lean();

      if (!product) {
        res.status(404).json({
          success: false,
          message:
            'Product not found.',
        });

        return;
      }

      res.status(200).json({
        success: true,
        product,
      });
    } catch (error) {
      console.error(
        'Get product error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to fetch product.',
      });
    }
  }
);

/**
 * POST /api/products
 *
 * Admin only.
 *
 * Creates a product and automatically generates:
 * - slug
 * - SKU
 */
router.post(
  '/',
  protect,
  requireAdmin,
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const {
        name,
        description = '',
        brand = 'Atelier',
        category,
        price,
        discountPrice,
        stock = 0,
        sizes = [],
        colors = [],
        images = [],
        tags = [],
        isNewArrival = false,
        isFeatured = false,
        isActive = true,
      } = req.body;

      // --------------------------------
      // Required fields
      // --------------------------------
      if (
        typeof name !==
          'string' ||
        !name.trim()
      ) {
        res.status(400).json({
          success: false,
          message:
            'Product name is required.',
        });

        return;
      }

      if (
        typeof category !==
          'string' ||
        !category.trim()
      ) {
        res.status(400).json({
          success: false,
          message:
            'Category is required.',
        });

        return;
      }

      // --------------------------------
      // Price
      // --------------------------------
      const numericPrice =
        Number(price);

      if (
        !Number.isFinite(
          numericPrice
        ) ||
        numericPrice <= 0
      ) {
        res.status(400).json({
          success: false,
          message:
            'Please provide a valid price.',
        });

        return;
      }

      // --------------------------------
      // Discount price
      // --------------------------------
      let numericDiscountPrice:
        | number
        | undefined;

      if (
        discountPrice !==
          undefined &&
        discountPrice !== ''
      ) {
        numericDiscountPrice =
          Number(
            discountPrice
          );

        if (
          !Number.isFinite(
            numericDiscountPrice
          ) ||
          numericDiscountPrice < 0
        ) {
          res.status(400).json({
            success: false,
            message:
              'Please provide a valid discount price.',
          });

          return;
        }

        if (
          numericDiscountPrice >=
          numericPrice
        ) {
          res.status(400).json({
            success: false,
            message:
              'Discount price must be lower than the original price.',
          });

          return;
        }
      }

      // --------------------------------
      // Stock
      // --------------------------------
      const numericStock =
        Number(stock);

      if (
        !Number.isFinite(
          numericStock
        ) ||
        numericStock < 0
      ) {
        res.status(400).json({
          success: false,
          message:
            'Please provide a valid stock quantity.',
        });

        return;
      }

      // --------------------------------
      // Sizes
      // --------------------------------
      if (
        !Array.isArray(sizes)
      ) {
        res.status(400).json({
          success: false,
          message:
            'Sizes must be an array.',
        });

        return;
      }

      const cleanedSizes =
        sizes
          .map((size: unknown) =>
            String(size).trim()
          )
          .filter(Boolean);

      if (
        cleanedSizes.length === 0
      ) {
        res.status(400).json({
          success: false,
          message:
            'Please select at least one size.',
        });

        return;
      }

      // --------------------------------
      // Colors
      // --------------------------------
      if (
        !Array.isArray(colors)
      ) {
        res.status(400).json({
          success: false,
          message:
            'Colors must be an array.',
        });

        return;
      }

      const cleanedColors =
        colors
          .map(
            (color: unknown) =>
              String(color).trim()
          )
          .filter(Boolean);

      // --------------------------------
      // Tags
      // --------------------------------
      const cleanedTags =
        Array.isArray(tags)
          ? tags
              .map(
                (tag: unknown) =>
                  String(tag).trim()
              )
              .filter(Boolean)
          : [];

      // --------------------------------
      // Images
      // --------------------------------
      if (
        !Array.isArray(images) ||
        images.length === 0
      ) {
        res.status(400).json({
          success: false,
          message:
            'At least one product image is required.',
        });

        return;
      }

      const cleanedImages =
        images
          .filter(
            (image: unknown) =>
              typeof image ===
                'object' &&
              image !== null
          )
          .map(
            (
              image: {
                url?: unknown;
                publicId?: unknown;
                isPrimary?: unknown;
              },
              index: number
            ) => ({
              url:
                typeof image.url ===
                'string'
                  ? image.url.trim()
                  : '',

              publicId:
                typeof image.publicId ===
                'string'
                  ? image.publicId.trim()
                  : '',

              isPrimary:
                index === 0,
            })
          )
          .filter(
            (
              image: {
                url: string;
                publicId: string;
                isPrimary: boolean;
              }
            ) =>
              Boolean(image.url) &&
              Boolean(
                image.publicId
              )
          );

      if (
        cleanedImages.length === 0
      ) {
        res.status(400).json({
          success: false,
          message:
            'No valid product images were provided.',
        });

        return;
      }

      // --------------------------------
      // Generate slug
      // --------------------------------
      const slug =
        await generateUniqueSlug(
          name
        );

      // --------------------------------
      // Generate SKU
      // --------------------------------
      const sku =
        await generateUniqueSku();

      // --------------------------------
      // Create product
      // --------------------------------
      const product =
        await Product.create({
          name: name.trim(),

          slug,

          sku,

          description:
            typeof description ===
            'string'
              ? description.trim()
              : '',

          brand:
            typeof brand ===
              'string' &&
            brand.trim()
              ? brand.trim()
              : 'Atelier',

          category:
            category.trim(),

          price:
            numericPrice,

          discountPrice:
            numericDiscountPrice,

          stock:
            numericStock,

          sizes:
            cleanedSizes,

          colors:
            cleanedColors,

          images:
            cleanedImages,

          tags:
            cleanedTags,

          ratingsAverage: 0,

          ratingsQuantity: 0,

          isNewArrival:
            Boolean(
              isNewArrival
            ),

          isFeatured:
            Boolean(
              isFeatured
            ),

          isActive:
            Boolean(
              isActive
            ),
        });

      res.status(201).json({
        success: true,

        message:
          'Product created successfully.',

        product,
      });
    } catch (error) {
      console.error(
        '========================================'
      );

      console.error(
        'CREATE PRODUCT ERROR'
      );

      console.error(error);

      console.error(
        '========================================'
      );

      const message =
        error instanceof Error
          ? error.message
          : 'Unknown server error';

      res.status(500).json({
        success: false,

        message:
          `Failed to create product: ${message}`,
      });
    }
  }
);

/**
 * PUT /api/products/:id
 *
 * Admin only.
 */
router.put(
  '/:id',
  protect,
  requireAdmin,
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const id = String(
        req.params.id
      );

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        res.status(400).json({
          success: false,
          message:
            'Invalid product ID.',
        });

        return;
      }

      const {
        name,
        description,
        brand,
        category,
        price,
        discountPrice,
        stock,
        sizes,
        colors,
        images,
        tags,
        isNewArrival,
        isFeatured,
        isActive,
      } = req.body;

      const updateData: Record<
        string,
        unknown
      > = {};

      if (
        typeof name ===
          'string' &&
        name.trim()
      ) {
        updateData.name =
          name.trim();
      }

      if (
        typeof description ===
        'string'
      ) {
        updateData.description =
          description.trim();
      }

      if (
        typeof brand ===
        'string'
      ) {
        updateData.brand =
          brand.trim();
      }

      if (
        typeof category ===
          'string' &&
        category.trim()
      ) {
        updateData.category =
          category.trim();
      }

      if (
        price !== undefined
      ) {
        const numericPrice =
          Number(price);

        if (
          !Number.isFinite(
            numericPrice
          ) ||
          numericPrice <= 0
        ) {
          res.status(400).json({
            success: false,
            message:
              'Invalid price.',
          });

          return;
        }

        updateData.price =
          numericPrice;
      }

      if (
        discountPrice !==
          undefined &&
        discountPrice !== ''
      ) {
        const numericDiscount =
          Number(
            discountPrice
          );

        if (
          !Number.isFinite(
            numericDiscount
          ) ||
          numericDiscount < 0
        ) {
          res.status(400).json({
            success: false,
            message:
              'Invalid discount price.',
          });

          return;
        }

        const currentPrice =
          Number(
            updateData.price ??
              price
          );

        if (
          Number.isFinite(
            currentPrice
          ) &&
          numericDiscount >=
            currentPrice
        ) {
          res.status(400).json({
            success: false,
            message:
              'Discount price must be lower than the original price.',
          });

          return;
        }

        updateData.discountPrice =
          numericDiscount;
      } else if (
        discountPrice === ''
      ) {
        updateData.discountPrice =
          undefined;
      }

      if (
        stock !== undefined
      ) {
        const numericStock =
          Number(stock);

        if (
          !Number.isFinite(
            numericStock
          ) ||
          numericStock < 0
        ) {
          res.status(400).json({
            success: false,
            message:
              'Invalid stock quantity.',
          });

          return;
        }

        updateData.stock =
          numericStock;
      }

      if (
        Array.isArray(sizes)
      ) {
        updateData.sizes =
          sizes
            .map(
              (size: unknown) =>
                String(size).trim()
            )
            .filter(Boolean);
      }

      if (
        Array.isArray(colors)
      ) {
        updateData.colors =
          colors
            .map(
              (color: unknown) =>
                String(color).trim()
            )
            .filter(Boolean);
      }

      if (
        Array.isArray(images)
      ) {
        updateData.images =
          images
            .filter(
              (image: unknown) =>
                typeof image ===
                  'object' &&
                image !== null
            )
            .map(
              (
                image: {
                  url?: unknown;
                  publicId?: unknown;
                  isPrimary?: unknown;
                },
                index: number
              ) => ({
                url:
                  typeof image.url ===
                  'string'
                    ? image.url.trim()
                    : '',

                publicId:
                  typeof image.publicId ===
                  'string'
                    ? image.publicId.trim()
                    : '',

                isPrimary:
                  index === 0,
              })
            )
            .filter(
              (
                image: {
                  url: string;
                  publicId: string;
                  isPrimary: boolean;
                }
              ) =>
                Boolean(
                  image.url
                ) &&
                Boolean(
                  image.publicId
                )
            );
      }

      if (
        Array.isArray(tags)
      ) {
        updateData.tags =
          tags
            .map(
              (tag: unknown) =>
                String(tag).trim()
            )
            .filter(Boolean);
      }

      if (
        isNewArrival !==
        undefined
      ) {
        updateData.isNewArrival =
          Boolean(
            isNewArrival
          );
      }

      if (
        isFeatured !==
        undefined
      ) {
        updateData.isFeatured =
          Boolean(
            isFeatured
          );
      }

      if (
        isActive !==
        undefined
      ) {
        updateData.isActive =
          Boolean(
            isActive
          );
      }

      /*
       * Do not allow the admin UI
       * to directly change SKU or slug.
       */
      const product =
        await Product.findByIdAndUpdate(
          id,
          updateData,
          {
            new: true,
            runValidators: true,
          }
        );

      if (!product) {
        res.status(404).json({
          success: false,
          message:
            'Product not found.',
        });

        return;
      }

      res.status(200).json({
        success: true,

        message:
          'Product updated successfully.',

        product,
      });
    } catch (error) {
      console.error(
        'Update product error:',
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : 'Unknown server error';

      res.status(500).json({
        success: false,

        message:
          `Failed to update product: ${message}`,
      });
    }
  }
);

/**
 * DELETE /api/products/:id
 *
 * Admin only.
 */
router.delete(
  '/:id',
  protect,
  requireAdmin,
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const id = String(
        req.params.id
      );

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        res.status(400).json({
          success: false,
          message:
            'Invalid product ID.',
        });

        return;
      }

      const product =
        await Product.findByIdAndDelete(
          id
        );

      if (!product) {
        res.status(404).json({
          success: false,
          message:
            'Product not found.',
        });

        return;
      }

      res.status(200).json({
        success: true,

        message:
          'Product deleted successfully.',
      });
    } catch (error) {
      console.error(
        'Delete product error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to delete product.',
      });
    }
  }
);

export default router;
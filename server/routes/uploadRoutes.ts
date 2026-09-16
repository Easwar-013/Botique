import {
  Router,
  Request,
  Response,
  NextFunction,
} from 'express';

import multer from 'multer';
import path from 'path';
import mongoose from 'mongoose';

import {
  protect,
  requireAdmin,
} from '../middleware/auth';

const router = Router();

/*
 * =====================================================
 * LIMITS
 * =====================================================
 *
 * Frontend compresses images to <= 95 KB.
 *
 * The server accepts up to 20 MB so Multer can
 * receive an original image if necessary.
 *
 * We still reject anything above 100 KB after
 * the multipart upload reaches the route.
 * =====================================================
 */

const MAX_UPLOAD_SIZE =
  20 * 1024 * 1024;

const MAX_STORED_SIZE =
  100 * 1024;

/*
 * =====================================================
 * GRIDFS
 * =====================================================
 */

const GRIDFS_BUCKET_NAME =
  'productImages';

const getGridFSBucket = () => {
  const db =
    mongoose.connection.db;

  if (!db) {
    throw new Error(
      'MongoDB connection is not ready.'
    );
  }

  return new mongoose.mongo.GridFSBucket(
    db,
    {
      bucketName:
        GRIDFS_BUCKET_NAME,
    }
  );
};

/*
 * =====================================================
 * MULTER MEMORY STORAGE
 * =====================================================
 */

const storage =
  multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize:
      MAX_UPLOAD_SIZE,
  },

  fileFilter: (
    _req,
    file,
    callback
  ) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (
      allowedTypes.includes(
        file.mimetype
      )
    ) {
      callback(
        null,
        true
      );

      return;
    }

    callback(
      new Error(
        'Only JPG, PNG and WEBP images are allowed.'
      )
    );
  },
});

/*
 * =====================================================
 * CREATE GRIDFS FILENAME
 * =====================================================
 */

const createFileName = (
  originalName: string
): string => {
  const extension =
    path.extname(
      originalName
    );

  const baseName =
    path
      .basename(
        originalName,
        extension
      )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        '-'
      )
      .replace(
        /^-|-$/g,
        ''
      );

  const finalExtension =
    extension
      ? extension.toLowerCase()
      : '.webp';

  return `${
    baseName ||
    'product'
  }-${Date.now()}-${Math.round(
    Math.random() * 100000
  )}${finalExtension}`;
};

/*
 * =====================================================
 * UPLOAD BUFFER TO GRIDFS
 * =====================================================
 */

const uploadBufferToGridFS = (
  buffer: Buffer,
  filename: string,
  contentType: string,
  originalName: string
): Promise<string> => {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      try {
        const bucket =
          getGridFSBucket();

        const uploadStream =
          bucket.openUploadStream(
            filename,
            {
              metadata: {
                contentType,
                originalName,
              },
            }
          );

        uploadStream.on(
          'error',
          (error) => {
            reject(error);
          }
        );

        uploadStream.on(
          'finish',
          () => {
            resolve(
              filename
            );
          }
        );

        uploadStream.end(
          buffer
        );
      } catch (error) {
        reject(error);
      }
    }
  );
};

/*
 * =====================================================
 * POST /api/upload/image
 * =====================================================
 */

router.post(
  '/image',
  protect,
  requireAdmin,

  /*
   * Multer is handled through a callback so
   * Multer errors are returned properly.
   */
  (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    upload.single(
      'image'
    )(
      req,
      res,
      (error) => {
        if (error) {
          console.error(
            'Multer upload error:',
            error
          );

          if (
            error instanceof
            multer.MulterError
          ) {
            if (
              error.code ===
              'LIMIT_FILE_SIZE'
            ) {
              res.status(
                400
              ).json({
                success: false,
                message:
                  'Image is too large. Please use an image under 20 MB.',
              });

              return;
            }

            res.status(
              400
            ).json({
              success: false,
              message:
                error.message,
            });

            return;
          }

          res.status(
            400
          ).json({
            success: false,
            message:
              error instanceof
              Error
                ? error.message
                : 'Image upload failed.',
          });

          return;
        }

        next();
      }
    );
  },

  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      /*
       * Verify Multer actually received
       * the image field.
       */
      if (!req.file) {
        console.error(
          'Upload request contained no image file.'
        );

        res.status(
          400
        ).json({
          success: false,
          message:
            'Please select an image.',
        });

        return;
      }

      console.log(
        '[Upload] Received:',
        {
          originalName:
            req.file
              .originalname,

          mimetype:
            req.file.mimetype,

          size:
            req.file.size,

          fieldName:
            req.file.fieldname,
        }
      );

      /*
       * Final storage safety check.
       */
      if (
        req.file.size >
        MAX_STORED_SIZE
      ) {
        res.status(
          400
        ).json({
          success: false,
          message:
            'Image must be 100 KB or smaller after compression.',
        });

        return;
      }

      /*
       * Generate filename.
       */
      const filename =
        createFileName(
          req.file.originalname
        );

      /*
       * Store image in MongoDB GridFS.
       */
      await uploadBufferToGridFS(
        req.file.buffer,
        filename,
        req.file.mimetype,
        req.file.originalname
      );

      /*
       * Keep the URL structure used
       * by the existing frontend.
       */
      const imageUrl =
        `/uploads/products/${filename}`;

      console.log(
        '[Upload] Stored in MongoDB GridFS:',
        imageUrl
      );

      res.status(
        200
      ).json({
        success: true,

        image: {
          url: imageUrl,

          publicId:
            filename,

          isPrimary:
            false,
        },
      });
    } catch (error) {
      console.error(
        'Image upload error:',
        error
      );

      res.status(
        500
      ).json({
        success: false,
        message:
          error instanceof
          Error
            ? error.message
            : 'Image upload failed.',
      });
    }
  }
);

export default router;
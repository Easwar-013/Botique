import {
  Router,
  Request,
  Response,
} from 'express';

import multer from 'multer';
import path from 'path';
import mongoose from 'mongoose';

import {
  protect,
  requireAdmin,
} from '../middleware/auth';

const router = Router();

const MAX_FILE_SIZE = 100 * 1024;

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
 *
 * Images are kept in memory temporarily,
 * then uploaded directly to MongoDB GridFS.
 * No local filesystem is used.
 * =====================================================
 */

const storage =
  multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize:
      MAX_FILE_SIZE,
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
        '');

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
 *
 * Admin only
 *
 * Stores the image directly in
 * MongoDB GridFS.
 * =====================================================
 */

router.post(
  '/image',
  protect,
  requireAdmin,
  upload.single('image'),

  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message:
            'Please select an image.',
        });

        return;
      }

      if (
        req.file.size >
        MAX_FILE_SIZE
      ) {
        res.status(400).json({
          success: false,
          message:
            'Image must be 100 KB or smaller.',
        });

        return;
      }

      /*
       * Generate a unique filename.
       */
      const filename =
        createFileName(
          req.file.originalname
        );

      /*
       * Store image in GridFS.
       */
      await uploadBufferToGridFS(
        req.file.buffer,
        filename,
        req.file.mimetype,
        req.file.originalname
      );

      /*
       * IMPORTANT:
       *
       * Keep the same URL structure
       * your frontend already expects.
       */
      const imageUrl =
        `/uploads/products/${filename}`;

      res.status(200).json({
        success: true,

        image: {
          url: imageUrl,

          publicId:
            filename,

          isPrimary: false,
        },
      });
    } catch (error) {
      console.error(
        'Image upload error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Image upload failed.',
      });
    }
  }
);

export default router;
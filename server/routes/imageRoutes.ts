import {
  Router,
  type Request,
  type Response,
} from 'express';

import mongoose from 'mongoose';

const router = Router();

const GRIDFS_BUCKET_NAME =
  'productImages';

/*
 * =====================================================
 * GET /uploads/products/:filename
 *
 * Streams product image from MongoDB GridFS.
 *
 * This keeps your existing image URLs working:
 *
 * /uploads/products/shirt.webp
 * =====================================================
 */

router.get(
  '/products/:filename',
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const filename = String(
        req.params.filename
      );

      if (!filename) {
        res.status(400).end();
        return;
      }

      const db =
        mongoose.connection.db;

      if (!db) {
        res.status(503).json({
          success: false,
          message:
            'Database connection is not ready.',
        });

        return;
      }

      const bucket =
        new mongoose.mongo.GridFSBucket(
          db,
          {
            bucketName:
              GRIDFS_BUCKET_NAME,
          }
        );

      /*
       * Find the GridFS file by filename.
       */
      const files =
        await db
          .collection(
            `${GRIDFS_BUCKET_NAME}.files`
          )
          .find({
            filename,
          })
          .sort({
            uploadDate:
              -1,
          })
          .limit(1)
          .toArray();

      if (
        files.length === 0
      ) {
        res.status(404).json({
          success: false,
          message:
            'Image not found.',
        });

        return;
      }

      const file =
        files[0];

      /*
       * Read MIME type from metadata.
       */
      const contentType =
        typeof file.metadata
          ?.contentType ===
        'string'
          ? file.metadata
              .contentType
          : 'application/octet-stream';

      res.setHeader(
        'Content-Type',
        contentType
      );

      if (
        typeof file.length ===
        'number'
      ) {
        res.setHeader(
          'Content-Length',
          file.length
        );
      }

      /*
       * Cache product images.
       */
      res.setHeader(
        'Cache-Control',
        'public, max-age=31536000, immutable'
      );

      /*
       * Stream image from GridFS.
       */
      const downloadStream =
        bucket.openDownloadStreamByName(
          filename
        );

      downloadStream.on(
        'error',
        (error) => {
          console.error(
            'GridFS image stream error:',
            error
          );

          if (
            !res.headersSent
          ) {
            res.status(404).end();
          } else {
            res.end();
          }
        }
      );

      downloadStream.pipe(
        res
      );
    } catch (error) {
      console.error(
        'Get product image error:',
        error
      );

      if (
        !res.headersSent
      ) {
        res.status(500).json({
          success: false,
          message:
            'Failed to load image.',
        });
      }
    }
  }
);

export default router;
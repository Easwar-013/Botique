import {
  Router,
  Request,
  Response,
} from 'express';

import multer from 'multer';
import path from 'path';
import fs from 'fs';

import {
  protect,
  requireAdmin,
} from '../middleware/auth';

const router = Router();

const MAX_FILE_SIZE = 100 * 1024;

const uploadDirectory = path.join(
  process.cwd(),
  'uploads',
  'products'
);

// Make sure the folder exists
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage =
  multer.diskStorage({
    destination: (
      _req,
      _file,
      callback
    ) => {
      callback(
        null,
        uploadDirectory
      );
    },

    filename: (
      _req,
      file,
      callback
    ) => {
      const extension =
        path.extname(file.originalname);

      const baseName =
        path
          .basename(
            file.originalname,
            extension
          )
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

      const uniqueName =
        `${baseName || 'product'}-${Date.now()}-${Math.round(
          Math.random() * 100000
        )}.webp`;

      callback(
        null,
        uniqueName
      );
    },
  });

const upload = multer({
  storage,

  limits: {
    fileSize: MAX_FILE_SIZE,
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
      callback(null, true);
      return;
    }

    callback(
      new Error(
        'Only JPG, PNG and WEBP images are allowed.'
      )
    );
  },
});

/**
 * POST /api/upload/image
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
        // Delete oversized file
        try {
          fs.unlinkSync(
            req.file.path
          );
        } catch {
          // Ignore cleanup error
        }

        res.status(400).json({
          success: false,
          message:
            'Image must be 100 KB or smaller.',
        });

        return;
      }

      /*
       * Files are served publicly from /uploads.
       *
       * Example:
       * /uploads/products/shirt-12345.webp
       */
      const imageUrl =
        `/uploads/products/${req.file.filename}`;

      res.status(200).json({
        success: true,

        image: {
          url: imageUrl,

          publicId:
            req.file.filename,

          isPrimary: false,
        },
      });
    } catch (error) {
      console.error(
        'Image upload error:',
        error
      );

      // Cleanup if a file was created
      if (req.file?.path) {
        try {
          fs.unlinkSync(
            req.file.path
          );
        } catch {
          // Ignore cleanup error
        }
      }

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
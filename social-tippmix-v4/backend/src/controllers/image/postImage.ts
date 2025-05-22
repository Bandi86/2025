import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import prisma from '../../lib/client';
import {
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  FileUploadError,
  DatabaseError,
  ErrorCode,
} from '../../lib/error';
import { logInfo, logError } from '../../lib/logger';

// Express route handler for image upload
const uploadPostImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check authentication
    const currentUserId = (req.user as any)?.id;
    if (!currentUserId) {
      throw new UnauthorizedError('Authentication required to upload images');
    }

    // Verify file exists (multer middleware already saved it)
    if (!req.file) {
      throw new FileUploadError('No file uploaded', ErrorCode.MISSING_REQUIRED_FIELD);
    }

    const { userId, postId } = req.body;

    // Validate that the user has permission to upload
    if (userId && userId !== currentUserId) {
      // Check if admin or moderator
      const userRole = (req.user as any)?.role || 'USER';
      const isAdminOrModerator = ['ADMIN', 'MODERATOR'].includes(userRole);

      if (!isAdminOrModerator) {
        throw new UnauthorizedError('You can only upload images for yourself');
      }
    }

    // If uploading for a post, check post exists and user is author
    if (postId) {
      try {
        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { id: true, authorId: true },
        });

        if (!post) {
          throw new NotFoundError('Post', postId);
        }

        // Check if user is author or admin
        if (post.authorId !== currentUserId) {
          const userRole = (req.user as any)?.role || 'USER';
          const isAdminOrModerator = ['ADMIN', 'MODERATOR'].includes(userRole);

          if (!isAdminOrModerator) {
            throw new UnauthorizedError('You can only upload images for your own posts');
          }
        }
      } catch (findError) {
        if (findError instanceof NotFoundError) {
          throw findError;
        }
        throw new DatabaseError('Failed to verify post ownership', 'query', {
          error: (findError as Error).message,
          postId,
        });
      }
    }

    // Get file info
    const originalPath = req.file.path;
    const fileSize = req.file.size;
    const mimeType = req.file.mimetype;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(mimeType)) {
      // Remove invalid file
      try {
        await fs.unlink(originalPath);
      } catch (unlinkError) {
        logError('Failed to delete invalid file', unlinkError, { path: originalPath });
      }

      throw new FileUploadError(
        `Invalid file type. Allowed types: ${validImageTypes.join(', ')}`,
        ErrorCode.INVALID_FILE_TYPE,
        { providedType: mimeType }
      );
    }

    try {
      // Determine output format based on input
      const ext = path.extname(originalPath).toLowerCase();
      const isPng = ext === '.png' || mimeType === 'image/png';
      const outputExt = isPng ? '.png' : '.jpg';
      const outputPath = isPng
        ? originalPath // Keep PNG as PNG
        : originalPath.replace(/\.[^.]+$/, '.jpg'); // Convert everything else to JPG

      // Process with sharp (max 800x800, quality 80%)
      await sharp(originalPath)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        [isPng ? 'png' : 'jpeg']({ quality: 80 })
        .toFile(outputPath);

      // If a new file was created (not PNG), delete the original
      if (!isPng && outputPath !== originalPath) {
        await fs.unlink(originalPath);
      }

      // Build the public URL (assuming /uploads is statically served)
      const relativePath = path.relative(path.join(__dirname, '../../../userFiles'), outputPath);
      const imageUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;

      // Save metadata about the upload
      try {
        // Create an image record in the database
        const image = await prisma.image.create({
          data: {
            url: imageUrl,
            fileName: path.basename(outputPath),
            fileSize: fileSize,
            fileType: mimeType,
            width: 800, // Maximum dimensions after resize
            height: 800,
            user: currentUserId,

          },
        });

        // Update post with image URL if needed
        if (postId) {
          await prisma.post.update({
            where: { id: postId },
            data: { imageUrl: imageUrl },
          });
        }

        // Update user avatar if needed
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { avatar: imageUrl },
          });
        }

        logInfo('Image uploaded successfully', {
          imageId: image.id,
          url: imageUrl,
          uploadedBy: currentUserId,
          target: postId ? `post:${postId}` : userId ? `user:${userId}` : 'none',
        });

        // Send the image URL back to the client
        res.status(200).json({
          success: true,
          message: 'Image uploaded successfully',
          url: imageUrl,
          imageId: image.id,
        });
      } catch (dbError) {
        throw new DatabaseError('Failed to save image metadata', 'insert', {
          error: (dbError as Error).message,
        });
      }
    } catch (processError) {
      // If it's a sharp error or file system error
      if (!(processError instanceof DatabaseError)) {
        throw new FileUploadError('Failed to process image', ErrorCode.FILE_UPLOAD_FAILED, {
          error: (processError as Error).message,
        });
      }
      throw processError;
    }
  } catch (error) {
    next(error);
  }
};

export default uploadPostImage;

import { DeleteObjectCommand, DeleteObjectCommandInput, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
import config from "../config";
import { db } from "../db";
import { BadRequestError } from "../errors/bad-request.error";
import { FileRepository } from "../repositories/file.repository";
import awsUtil from "../utils/aws.util";
import logger from "../utils/logger";
export interface IUploadFileParams {
    userId: string,
    file: Express.Multer.File,
    folderId?: string
}

class FileService {
    private _Bucket: string;
    private _db = db;
    constructor(private readonly _fileRepository: FileRepository) {
        this._Bucket = config.S3_UPLOAD_BUCKET;
    }

    async uploadFile(params: IUploadFileParams) {
        const s3Client = await awsUtil.s3Client();
        const { file, userId, folderId } = params;
        const fileId = Date.now();
        const p = file.originalname.split(".");
        const ext = p[p.length - 1];
        const Key = `__outputs/${userId}/${file.originalname.replace(".", "") + "_" + fileId + "." + ext}`;

        if (file.size > 10 * 1024 * 1024) {
            try {
                logger.info("Using S3-lib-storage to upload the file");
                const upload = new Upload({
                    client: s3Client,
                    params: {
                        Bucket: this._Bucket,
                        Key,
                        Body: fs.createReadStream(file.path),
                        ContentType: file.mimetype
                    },
                    tags: [],
                    queueSize: 4,
                    partSize: 5 * 1024 * 1024
                });

                logger.info("Starting to upload...");

                upload.on("httpUploadProgress", (progress) => {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const percentage = Math.round((progress.loaded! / progress.total!) * 100);
                    logger.info(`Upload progress: ${percentage}%`);
                });

                const { $metadata } = await upload.done();
                if ($metadata.httpStatusCode === 200) {
                    logger.info(`File uploaded successfully - ${file.originalname}`);
                } else {
                    logger.error("Upload not successful");
                }

            } catch (error) {
                logger.error(error);
                throw new Error("Failed to upload file");
            } finally {
                fs.unlinkSync(file.path);
            }
        } else {
            try {
                logger.info("Using PutObjectCommand to upload file");
                const uploadCommandParams: PutObjectCommandInput = {
                    Bucket: this._Bucket,
                    Key,
                    Body: fs.createReadStream(file.path),
                    ContentType: file.mimetype
                };

                logger.info("Starting to upload...");

                const { $metadata } = await s3Client.send(new PutObjectCommand(uploadCommandParams));

                if ($metadata.httpStatusCode === 200) {
                    logger.info(`File uploaded successfully - ${file.originalname}`);
                } else {
                    logger.error("Upload not successful");
                }
            } catch (error) {
                logger.error(error);
                throw new Error(`failed to upload file - ${file.originalname}`);
            } finally {
                fs.unlinkSync(file.path);
            }

        }

        try {
            const fileInfo = await this._fileRepository.createFile({
                fileName: file.originalname,
                ownerId: userId,
                folderId,
                s3Key: Key,
                size: file.size.toString()
            });
            return fileInfo;
        } catch (error) {
            const deleteObjectParams: DeleteObjectCommandInput = {
                Bucket: this._Bucket,
                Key
            };
            try {
                await s3Client.send(new DeleteObjectCommand(deleteObjectParams));
            } catch (error) {
                logger.error(`Failed to rollback uploaded files from s3 - ${error}`);
                throw error;
            }
            logger.error(`failed to insert the record in the database`);
            throw error;
        }

    }

    async getFileInfo(params: { fileId: string, ownerId: string }) {
        const { fileId, ownerId } = params;

        const file = await this._fileRepository.getFile({ fileId, ownerId });
        if (!file) throw new BadRequestError("File not found");

        return file;
    }

    async listAllFiles(ownerId: string) {
        const files = await this._fileRepository.getAllFiles(ownerId);
        if (!files) throw new BadRequestError("Files not found");

        return files;
    }

    async listFilesOfFolder(params: { ownerId: string, folderId: string }) {
        const { ownerId, folderId } = params;

        const filesList = await this._fileRepository.getFilesOfFolder({ ownerId, folderId });
        if (!filesList) throw new BadRequestError("No files inside folder");

        return filesList;
    }

    async deleteFile(params: { ownerId: string, fileId: string }) {
        const { fileId, ownerId } = params;

        // delete from s3 bucket
        const { s3Key } = await this._fileRepository.getS3Key(fileId) || { s3Key: "" };
        if (!s3Key) throw new BadRequestError("Failed to get storage key");


        // delete record from database
        let deletedFile;
        try {
            deletedFile = await this._db.transaction().execute(async () => {
                const deleted = await this._fileRepository.deleteFile({ fileId, ownerId });
                if (!deleted) throw new BadRequestError("Failed to delete file from database");

                return deleted;
            });
        } catch (error) {
            logger.error(error);
            throw new BadRequestError(`failed to delete file from database - ${fileId}`);
        }

        try {
            const deleteObjectParams: DeleteObjectCommandInput = {
                Bucket: this._Bucket,
                Key: s3Key,
            };

            const deleteObjectCommand = new DeleteObjectCommand(deleteObjectParams);
            const s3Client = await awsUtil.s3Client();

            const { $metadata } = await s3Client.send(deleteObjectCommand);
            if ($metadata.httpStatusCode === 204) logger.info(`File deleted successfully - ${s3Key}`);
            else logger.error("Failed to delete file");

        } catch (error) {
            logger.error(error);

            await this._fileRepository.createFile({
                id: fileId,
                ownerId,
                fileName: deletedFile.fileName,
                s3Key,
            });
            throw new BadRequestError(`failed to delete file from s3 bucket - ${s3Key}`);
        }

        return deletedFile;
    }
}

export default new FileService(new FileRepository());

import { PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import config from '../config';
import { BadRequestError } from '../errors/bad-request.error';
import { FileRepository } from "../repositories/file.repository";
import awsUtil from "../utils/aws.util";
import logger from '../utils/logger';
export interface IUploadFileParams {
    userId: string,
    file: Express.Multer.File
}

class FileService {
    private _Bucket: string;
    constructor(private readonly _fileRepository: FileRepository) {
        this._Bucket = config.S3_UPLOAD_BUCKET;
    }

    async uploadFile(params: IUploadFileParams) {
        const s3Client = await awsUtil.s3Client();
        const { file, userId } = params;
        const fileId = Date.now();
        const p = file.originalname.split('.');
        const ext = p[p.length - 1];
        const Key = `__outputs/${userId}/${file.originalname.replace('.', '') + '_' + fileId + '.' + ext}`;

        if (file.size > 10 * 1024 * 1024) {
            try {
                logger.info('Using S3-lib-storage to upload the file')
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

                logger.info('Starting to upload...');

                upload.on('httpUploadProgress', (progress) => {
                    const percentage = Math.round((progress.loaded! / progress.total!) * 100);
                    logger.info(`Upload progress: ${percentage}%`);
                });

                const { $metadata } = await upload.done();
                if ($metadata.httpStatusCode === 200) {
                    logger.info(`File uploaded successfully - ${file.originalname}`);
                } else {
                    logger.error('Upload not successful')
                }

            } catch (error) {
                logger.error(error);
                throw new Error('Failed to upload file');
            } finally {
                fs.unlinkSync(file.path)
            }
        } else {
            try {
                logger.info('Using PutObjectCommand to upload file')
                const uploadCommandParams: PutObjectCommandInput = {
                    Bucket: this._Bucket,
                    Key,
                    Body: fs.createReadStream(file.path),
                    ContentType: file.mimetype
                };

                logger.info('Starting to upload...');

                const { $metadata } = await s3Client.send(new PutObjectCommand(uploadCommandParams));

                if ($metadata.httpStatusCode === 200) {
                    logger.info(`File uploaded successfully - ${file.originalname}`);
                } else {
                    logger.error('Upload not successful');
                }
            } catch (error) {
                logger.error(error);
                throw new Error(`failed to upload file - ${file.originalname}`);
            } finally {
                fs.unlinkSync(file.path)
            }

        }

        const fileInfo = await this._fileRepository.createFile({
            fileName: file.originalname,
            ownerId: userId,
            s3Key: Key,
            size: file.size.toString()
        });

        return fileInfo;
    }

    async getFileInfo(params: { fileId: string, ownerId: string }) {
        const { fileId, ownerId } = params;

        console.log({ fileId, ownerId })

        const file = await this._fileRepository.getFile({ fileId, ownerId });
        if (!file) throw new BadRequestError('File not found');

        return file;
    }

    async listAllFiles(ownerId: string) {
        const files = await this._fileRepository.getAllFiles(ownerId);
        if (!files) throw new BadRequestError('Files not found');

        return files;
    }
}

export default new FileService(new FileRepository());

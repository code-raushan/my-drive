import { CompleteMultipartUploadCommandInput, CreateMultipartUploadCommand, CreateMultipartUploadCommandInput, ListMultipartUploadsCommand, UploadPartCommand, UploadPartCommandInput } from '@aws-sdk/client-s3';
import fs from 'fs';
import { BadRequestError } from '../errors/bad-request.error';
import { FileRepository } from "../repositories/file.repository";
import awsUtil from "../utils/aws.util";
import logger from '../utils/logger';

export interface IUploadFileParams {
    userId: string,
    file: Express.Multer.File
}
class FileService {
    constructor(private readonly _fileRepository: FileRepository) { }

    async uploadFile(params: IUploadFileParams) {
        // code to upload file to s3
        const s3Client = await awsUtil.s3Client();
        const { file, userId } = params;
        const fileId = Date.now();
        const p = file.originalname.split('.');
        const ext = p[p.length - 1];
        const Key = `${userId}/${file.originalname.replace('.', '') + '_' + fileId + '.' + ext}`;

        try {
            const uploadParams: CreateMultipartUploadCommandInput = {
                Bucket: 's3-bucket',
                Key,
                ContentType: file.mimetype
            };

            const createUploadCommand = new CreateMultipartUploadCommand(uploadParams);
            const { UploadId } = await s3Client.send(createUploadCommand);


            // upload chunks in parallel
            const partSize = 5 * 1024 * 1024;
            const numParts = Math.ceil(file.size / partSize);
            const partUploadPromises = [];

            for (let i = 0; i < numParts; i++) {
                const start = i * partSize;
                const end = Math.min(start + partSize, file.size);

                const chunk = fs.createReadStream(file.path, { start, end });

                const uploadChunkParams: UploadPartCommandInput = {
                    Bucket: 's3-bucket',
                    Key,
                    UploadId,
                    PartNumber: i + 1,
                    Body: chunk,
                };

                const uploadChunkCommand = new UploadPartCommand(uploadChunkParams);
                partUploadPromises.push(s3Client.send(uploadChunkCommand));
            };

            const partUploadResponses = await Promise.all(partUploadPromises);

            const completedParts = [];

            for (let i = 0; i < partUploadResponses.length; i++) {
                completedParts.push({
                    PartNumber: i + 1,
                    ETag: partUploadResponses[i].ETag
                })
            };

            const completeMultipartUploadsParams: CompleteMultipartUploadCommandInput = {
                Bucket: 's3-bucket',
                Key,
                UploadId,
                MultipartUpload: {
                    Parts: completedParts
                }
            };

            const completeMultipartUploadsCommand = new ListMultipartUploadsCommand(completeMultipartUploadsParams);
            await s3Client.send(completeMultipartUploadsCommand);
        } catch (error) {
            logger.error(error);
            throw new BadRequestError('Failed to upload file')
        }

        // code to save uploaded file information in DB
        const fileInfo = await this._fileRepository.createFile({
            fileName: file.originalname,
            ownerId: userId,
            s3Key: Key,
            size: file.size.toString()
        });

        return fileInfo;
    }
}

export default new FileService(new FileRepository());
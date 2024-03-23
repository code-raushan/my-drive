import { FileRepository } from "../repositories/file.repository";
// import {CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand} from '@aws-sdk/client-s3';
// import awsUtil from "../utils/aws.util";

class FileService {
    constructor(private readonly _fileRepository: FileRepository) { }

    async uploadFile() {
        // code to upload file to s3


        // code to save uploaded file information in DB
    }
}

export default new FileService(new FileRepository());
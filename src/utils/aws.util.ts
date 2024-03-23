import { S3Client } from '@aws-sdk/client-s3';
import config from "../config";

class AWSUtils {
    private S3_ACCESS_KEY_ID: string;
    private S3_SECRET_ACCESS_KEY: string;
    private AWS_REGION: string;

    constructor() {
        this.S3_ACCESS_KEY_ID = config.S3_ACCESS_KEY_ID;
        this.S3_SECRET_ACCESS_KEY = config.S3_SECRET_ACCESS_KEY;
        this.AWS_REGION = config.AWS_REGION;
    }

    async s3Client() {
        const client = new S3Client({
            region: this.AWS_REGION,
            maxAttempts: 3,
            retryMode: 'standard',
            // timeout: 300000 ,

            credentials: {
                accessKeyId: this.S3_ACCESS_KEY_ID,
                secretAccessKey: this.S3_SECRET_ACCESS_KEY
            }
        });

        return client;
    }
}

export default new AWSUtils();
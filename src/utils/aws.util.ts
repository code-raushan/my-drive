import { CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";
import { S3Client } from "@aws-sdk/client-s3";
import config from "../config";

class AWSUtils {
    private S3_ACCESS_KEY_ID: string;
    private S3_SECRET_ACCESS_KEY: string;
    private AWS_REGION: string;
    private AWS_COGNITO_ACCESS_KEY_ID: string;
    private AWS_COGNITO_SECRET_ACCESS: string;

    constructor() {
        this.S3_ACCESS_KEY_ID = config.S3_ACCESS_KEY_ID;
        this.S3_SECRET_ACCESS_KEY = config.S3_SECRET_ACCESS_KEY;
        this.AWS_REGION = config.AWS_REGION;
        this.AWS_COGNITO_ACCESS_KEY_ID = config.AWS_COGNITO_ACCESS_KEY_ID;
        this.AWS_COGNITO_SECRET_ACCESS = config.AWS_COGNITO_SECRET_ACCESS;
    }

    async s3Client() {
        const client = new S3Client({
            region: this.AWS_REGION,
            maxAttempts: 3,
            retryMode: "standard",
            credentials: {
                accessKeyId: this.S3_ACCESS_KEY_ID,
                secretAccessKey: this.S3_SECRET_ACCESS_KEY
            }
        });

        return client;
    }

    async cognitoClient() {
        const client = new CognitoIdentityProvider({
            region: this.AWS_REGION,
            credentials: {
                accessKeyId: this.AWS_COGNITO_ACCESS_KEY_ID,
                secretAccessKey: this.AWS_COGNITO_SECRET_ACCESS
            }
        });
        return client;
    }
}

export default new AWSUtils();
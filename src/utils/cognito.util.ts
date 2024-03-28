import { CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";
import config from "../config";

const cognitoClient = new CognitoIdentityProvider({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_COGNITO_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_COGNITO_SECRET_ACCESS
  }
});

export default cognitoClient;
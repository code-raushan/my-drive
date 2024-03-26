import { InitiateAuthCommand, InitiateAuthCommandInput, RespondToAuthChallengeCommand, RespondToAuthChallengeCommandInput } from "@aws-sdk/client-cognito-identity-provider";
import config from "../config";
import { BadRequestError } from "../errors/bad-request.error";
import { UserRepository } from "../repositories/user.repository";
import awsUtil from "../utils/aws.util";
import logger from "../utils/logger";

class AuthService {
  private userPoolId: string;
  private clientId: string;

  constructor(private readonly userRepository: UserRepository) {
    this.userPoolId = config.AWS_COGNITO_USER_POOL_ID;
    this.clientId = config.AWS_COGNITO_CLIENT_ID;
  }

  async sendOtp(phoneNumber: string) {
    try {
      const cognitoClient = await awsUtil.cognitoClient();
      // check if user exists in cognito user pool
      await this.checkUserExistenceInCognito(phoneNumber);

      // Initiate custom authentication flow to send OTP
      const params: InitiateAuthCommandInput = {
        AuthFlow: "CUSTOM_AUTH",
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: phoneNumber,
        },
      };

      const input = new InitiateAuthCommand(params);
      const response = await cognitoClient.send(input);
      return response;
    } catch (error) {
      logger.error(`Error in send otp function - ${error}`);
      throw error;
    }
  }

  async verifyOtp(phoneNumber: string, code: string, session: string) {
    try {
      const cognitoClient = await awsUtil.cognitoClient();

      const params: RespondToAuthChallengeCommandInput = {
        ChallengeName: "CUSTOM_CHALLENGE",
        ClientId: this.clientId,
        ChallengeResponses: {
          USERNAME: phoneNumber,
          ANSWER: code,
        },
        Session: session,
      };

      const input = new RespondToAuthChallengeCommand(params);
      const response = await cognitoClient.send(input);
      return response;
    } catch (error) {
      logger.error(`Error verifying OTP - ${error}`);
      throw error;
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const cognitoClient = await awsUtil.cognitoClient();

      const params: InitiateAuthCommandInput = {
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId: this.clientId,
        AuthParameters: {
          "REFRESH_TOKEN": refreshToken
        }
      };
      const response = await cognitoClient.send(new InitiateAuthCommand(params));

      return response;
    } catch (error) {
      logger.error(`Error refreshing token - ${error}`);
      throw error;
    }
  }

  private async checkUserExistenceInCognito(phoneNumber: string) {
    try {
      const cognitoClient = await awsUtil.cognitoClient();

      const { Username } = await cognitoClient.adminGetUser({
        UserPoolId: this.userPoolId,
        Username: phoneNumber,
      });
      if (!(await this.userRepository.checkIfUserAlreadyExists(phoneNumber))) {
        const user = await this.userRepository.create(phoneNumber);
        if (!user) throw new BadRequestError("Error creating user in database");

        await cognitoClient.adminUpdateUserAttributes(
          {
            UserAttributes: [
              {
                Name: "custom:userId",
                Value: user.id,
              }
            ],
            UserPoolId: this.userPoolId,
            Username: phoneNumber,
          }
        );
      }
      return Username;
      //eslint-disable-next-line
    } catch (error: any) {
      if (error.__type === "UserNotFoundException") {
        await this.createUserInCognitoAndDatabase(phoneNumber);
      }
      else {
        throw error;
      }
    }
  }

  private async createUserInCognitoAndDatabase(phoneNumber: string) {
    const cognitoClient = await awsUtil.cognitoClient();

    let user = await this.userRepository.checkIfUserAlreadyExists(phoneNumber);
    // Create the user in the database
    if (!user) {
      user = await this.userRepository.create(phoneNumber);
    }

    if (!user) throw new BadRequestError("Error creating user");

    // Create the user in Cognito
    await cognitoClient.adminCreateUser({
      UserPoolId: this.userPoolId,
      Username: phoneNumber,
      UserAttributes: [
        {
          Name: "phone_number",
          Value: phoneNumber,
        },
        {
          Name: "phone_number_verified",
          Value: "true",
        },
        {
          Name: "custom:userId",
          Value: user.id,
        }
      ],
      TemporaryPassword: config.TEMPORARY_COGNITO_USER_PASSSWORD,
      MessageAction: "SUPPRESS",
    });

  }
}

export default new AuthService(new UserRepository());

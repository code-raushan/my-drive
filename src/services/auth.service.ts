import { InitiateAuthCommand, InitiateAuthCommandInput, RespondToAuthChallengeCommand, RespondToAuthChallengeCommandInput } from "@aws-sdk/client-cognito-identity-provider";
import config from "../config";
import { BadRequestError } from "../errors/bad-request.error";
import { UserRepository } from "../repositories/user.repository";
import cognitoClient from "../utils/cognito.util";

class AuthService {
  private userPoolId: string;
  private clientId: string;

  constructor(private userRepository: UserRepository) {
    this.userPoolId = config.AWS_COGNITO_USER_POOL_ID;
    this.clientId = config.AWS_COGNITO_CLIENT_ID;
  }

  async sendOtp(phoneNumber: string) {
    try {
      // Check if the user exists in Cognito
      await this.checkUserExistenceInCognito(phoneNumber);

      // If user doesn't exist, create them in Cognito and the database
      if (!(await this.userRepository.checkIfUserAlreadyExists(phoneNumber))) {
        await this.createUserInCognitoAndDatabase(phoneNumber);
      }

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
      console.error("Error in sendOtp:", error);
      throw error;
    }
  }

  async verifyOtp(phoneNumber: string, code: string, session: string) {
    try {
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
      console.error("Error verifying OTP:", error);
      throw error;
    }
  }

  private async checkUserExistenceInCognito(phoneNumber: string) {
    try {
      await cognitoClient.adminGetUser({
        UserPoolId: this.userPoolId,
        Username: phoneNumber,
      });
    } catch (error: any) {
      if (error.__type !== "UserNotFoundException") {
        // If the error is not UserNotFoundException, rethrow it
        throw error;
      }
    }
  }

  private async createUserInCognitoAndDatabase(phoneNumber: string) {
    try {
      // Create the user in the database
      const user = await this.userRepository.create(phoneNumber);
      if (!user) throw new BadRequestError('Error creating user');

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
        TemporaryPassword: config.TEMPORARY_COGNITO_USER_PASSSWORD, // Consider using a secure, random password
        MessageAction: "SUPPRESS",
      });
    } catch (error) {
      throw error;
    }
  }
}

export default new AuthService(new UserRepository());

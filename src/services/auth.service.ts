import { PublishCommand, PublishCommandInput } from "@aws-sdk/client-sns";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import config from "../config";
import { BadRequestError } from "../errors/bad-request.error";
import { UserRepository } from "../repositories/user.repository";
import { UserSessionRepository } from "../repositories/user_session.repository";
import awsUtil from "../utils/aws.util";
import { generateOTP } from "../utils/generateOTP.util";
import logger from "../utils/logger";
import { signJWT, verifyJWT } from "./jwt";

class AuthService {
  private userPoolId: string;
  private clientId: string;

  constructor(private readonly userRepository: UserRepository, private readonly _userSessionRepository: UserSessionRepository) {
    this.userPoolId = config.AWS_COGNITO_USER_POOL_ID;
    this.clientId = config.AWS_COGNITO_CLIENT_ID;
  }

  async sendOtp(phoneNumber: string) {
    //   try {
    //     const cognitoClient = await awsUtil.cognitoClient();
    //     // check if user exists in cognito user pool
    //     await this.checkUserExistenceInCognito(phoneNumber);

    //     // Initiate custom authentication flow to send OTP
    //     const params: InitiateAuthCommandInput = {
    //       AuthFlow: "CUSTOM_AUTH",
    //       ClientId: this.clientId,
    //       AuthParameters: {
    //         USERNAME: phoneNumber,
    //       },
    //     };

    //     const input = new InitiateAuthCommand(params);
    //     const response = await cognitoClient.send(input);
    //     return response;
    //   } catch (error) {
    //     logger.error(`Error in send otp function - ${error}`);
    //     throw error;
    //   }

    try {
      const user = await this.userRepository.checkIfUserAlreadyExists(phoneNumber);
      const otp = generateOTP();
      const session = uuid();
      if (!user) {
        const user = await this.userRepository.create(phoneNumber);
        if (!user) throw new BadRequestError("Failed to create user");

        const userSession = await this._userSessionRepository.createSession({ otp, phoneNumber, session });
        if (!userSession) throw new BadRequestError("Failed to create user session record");

        const snsClient = await awsUtil.snsClient();

        const params: PublishCommandInput = {
          Message: `Your Verification Code for Euron is ${userSession.otp}`,
          PhoneNumber: phoneNumber,
          MessageAttributes: {
            "AWS.SNS.SMS.SMSType": {
              DataType: "String",
              StringValue: "Transactional"
            }
          }
        };

        await snsClient.send(new PublishCommand(params)).catch((error) => {
          throw new BadRequestError(`Failed to send OTP to user - ${error}`);
        });

        return { phoneNumber, session };

      } else {
        const userSession = await this._userSessionRepository.createSession({ otp, phoneNumber, session });
        if (!userSession) throw new BadRequestError("Failed to create user session record");

        const snsClient = await awsUtil.snsClient();

        const params: PublishCommandInput = {
          Message: `Your Verification Code for Euron is ${userSession.otp}`,
          PhoneNumber: phoneNumber,
          MessageAttributes: {
            "AWS.SNS.SMS.SMSType": {
              DataType: "String",
              StringValue: "Transactional"
            }
          }
        };

        await snsClient.send(new PublishCommand(params)).catch((error) => {
          throw new BadRequestError(`Failed to send OTP to user - ${error}`);
        });

        return { phoneNumber, session };
      }
    } catch (error) {
      throw new BadRequestError("Failed to send the otp");
    }
  }

  async verifyOtp(params: { phoneNumber: string, code: string, session: string }) {
    const { code, phoneNumber, session } = params;
    // try {
    //   const cognitoClient = await awsUtil.cognitoClient();

    //   const params: RespondToAuthChallengeCommandInput = {
    //     ChallengeName: "CUSTOM_CHALLENGE",
    //     ClientId: this.clientId,
    //     ChallengeResponses: {
    //       USERNAME: phoneNumber,
    //       ANSWER: code,
    //     },
    //     Session: session,
    //   };

    //   const input = new RespondToAuthChallengeCommand(params);
    //   const response = await cognitoClient.send(input);
    //   return response;
    // } catch (error) {
    //   logger.error(`Error verifying OTP - ${error}`);
    //   throw error;
    // }
    const userSession = await this._userSessionRepository.getSession({ phoneNumber, session });
    if (!userSession) throw new BadRequestError("Session not found, login again or create an account");

    if (userSession.otp !== code) throw new BadRequestError("Invalid OTP");

    const user = await this.userRepository.checkIfUserAlreadyExists(phoneNumber);
    if (!user) throw new BadRequestError("User not found");

    const accessToken = signJWT({ userId: user.id, phoneNumber }, "1d");
    const refreshToken = signJWT({ userId: user.id, phoneNumber }, "365d");

    return { message: "OTP validated successfully", type: "Bearer", accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    // try {
    //   const cognitoClient = await awsUtil.cognitoClient();

    //   const params: InitiateAuthCommandInput = {
    //     AuthFlow: "REFRESH_TOKEN_AUTH",
    //     ClientId: this.clientId,
    //     AuthParameters: {
    //       "REFRESH_TOKEN": refreshToken
    //     }
    //   };
    //   const response = await cognitoClient.send(new InitiateAuthCommand(params));

    //   return response;
    // } catch (error) {
    //   logger.error(`Error refreshing token - ${error}`);
    //   throw error;
    // }
    try {
      const payload = await verifyJWT(refreshToken, config.CLIENT_JWT_SECRET) as jwt.JwtPayload;

      const user = await this.userRepository.checkIfUserAlreadyExists(payload["phoneNumber"]);
      if (!user) throw new BadRequestError("User not found");

      const accessToken = signJWT({ userId: user.id, phoneNumber: user.phone, createdAt: Date.now() }, "1d");

      return { accessToken };
    } catch (error) {
      logger.error(error);
      throw new BadRequestError("Failed to refresh token");
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

export default new AuthService(new UserRepository(), new UserSessionRepository());

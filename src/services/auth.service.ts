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
}

export default new AuthService(new UserRepository(), new UserSessionRepository());

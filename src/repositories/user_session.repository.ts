import { v4 as uuid } from "uuid";
import { db } from "../db";

export class UserSessionRepository {
    private _db = db;

    async createSession(params: { phoneNumber: string, otp: string, session: string }) {
        const { phoneNumber, otp, session } = params;

        return this._db
            .insertInto("UserSession")
            .values({
                id: uuid(),
                phoneNumber,
                otp,
                session,
                createdAt: new Date(),
                updatedAt: new Date()
            })
            .returningAll()
            .executeTakeFirst();
    }

    async getSession(params: { phoneNumber: string, session: string }) {
        const { phoneNumber, session } = params;

        return this._db
            .selectFrom("UserSession")
            .selectAll()
            .where((eb) => eb.and({ phoneNumber, session }))
            .orderBy("UserSession.createdAt", "desc")
            .limit(1)
            .executeTakeFirst();
    }
}
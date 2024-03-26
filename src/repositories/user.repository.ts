import { v4 as uuid } from 'uuid';
import { db } from "../db";

export class UserRepository {
  private _db = db

  async checkIfUserAlreadyExists(phoneNumber: string) {
    return this._db.selectFrom('User').selectAll().where('User.phone', '=', phoneNumber).executeTakeFirst();
  }

  async create(phoneNumber: string) {
    return this._db.insertInto('User').values({ id: uuid(), phone: phoneNumber }).returningAll().executeTakeFirst();
  }
}


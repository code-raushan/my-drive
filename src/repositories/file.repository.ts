import { v4 as uuid } from 'uuid';
import { db } from "../db";

export interface ICreateFileParams {
    fileName: string;
    s3Key: string;
    ownerId: string;
    size?: string;
}


export class FileRepository {
    private _db = db;

    async createFile(params: ICreateFileParams) {
        const { fileName, ownerId, s3Key, size } = params;

        return this._db.insertInto('File').values({
            id: uuid(),
            fileName,
            ownerId,
            s3Key,
            size: size ? size : null,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returningAll().executeTakeFirst();
    }
}

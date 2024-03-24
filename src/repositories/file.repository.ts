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

    async getFile(params: { fileId: string, ownerId: string }) {
        const { fileId, ownerId } = params;

        console.log('in repository logic');
        console.log({ fileId, ownerId })

        // return this._db.selectFrom('File').selectAll().where((eb) =>
        //     eb.and([
        //         eb('File.id', '=', String(fileId)),
        //         eb('File.ownerId', '=', String(ownerId))
        //     ])
        // ).executeTakeFirst();

        return this._db
            .selectFrom('File')
            .selectAll()
            .where((eb) => eb.and({ id: fileId, ownerId }))
            .executeTakeFirst();
    }

    async getAllFiles(ownerId: string) {
        return this._db.selectFrom('File').selectAll().where("File.ownerId", "=", ownerId).execute();
    }

    async getS3Key(fileId: string) {
        return this._db.selectFrom('File').select('File.s3Key').where('File.id', '=', fileId).executeTakeFirst();
    }

    async deleteFile(params: { fileId: string, ownerId: string }) {
        const { fileId, ownerId } = params;

        return this._db.deleteFrom('File').where(eb => eb.and({ id: fileId, ownerId })).returningAll().executeTakeFirst();
    }
}

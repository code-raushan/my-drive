import { v4 as uuid } from 'uuid';
import { db } from "../db";
class FolderRepository {
    private _db = db;

    async createFolder(params: { ownerId: string, folderName: string }) {
        const { ownerId, folderName } = params;

        return this._db
            .insertInto('Folder')
            .values({
                id: uuid(),
                ownerId,
                folderName,
                createdAt: new Date(),
                updateAt: new Date()
            })
            .returningAll()
            .executeTakeFirst();
    }

    async listFolderItems(params: { ownerId: string, folderId: string }) {
        const { ownerId, folderId } = params;

        return this._db
            .selectFrom('Folder')
            .selectAll()
            .where((eb) => eb.and({ id: folderId, ownerId }))
            .execute();
    }

    async listAllFolders(ownerId: string) {
        return this._db
            .selectFrom('Folder')
            .selectAll()
            .where('Folder.ownerId', '=', ownerId)
            .execute()
    }

    async deleteFolder(params: { ownerId: string, folderId: string }) {
        const { ownerId, folderId } = params;

        return this._db
            .deleteFrom('Folder')
            .where((eb) => eb.and({ id: folderId, ownerId }))
            .returningAll()
            .executeTakeFirst()
    }

    async updateFolder(params: { ownerId: string, folderId: string, newFolderName: string }) {
        const { ownerId, folderId, newFolderName } = params;

        return this._db
            .updateTable('Folder')
            .set({ folderName: newFolderName })
            .where((eb) => eb.and({ id: folderId, ownerId }))
            .executeTakeFirst()
    }
}
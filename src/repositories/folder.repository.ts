import { v4 as uuid } from 'uuid';
import { db } from "../db";
export class FolderRepository {
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
                updatedAt: new Date()
            })
            .returningAll()
            .executeTakeFirst();
    }

    async createSubFolder(params: { ownerId: string, parentFolderId: string, folderName: string }) {
        const { ownerId, parentFolderId, folderName } = params;

        return this._db
            .insertInto('Folder')
            .values({
                id: uuid(),
                ownerId,
                parentFolderId,
                folderName,
                createdAt: new Date(),
                updatedAt: new Date()
            })
            .returningAll()
            .executeTakeFirst();
    }

    async listSubFolders(params: { ownerId: string, folderId: string }) {
        const { ownerId, folderId } = params;

        return this._db
            .selectFrom('Folder')
            .selectAll()
            .where((eb) => eb.and({ parentFolderId: folderId, ownerId: ownerId }))
            .execute()
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
            .set({ folderName: newFolderName, updatedAt: new Date() })
            .where((eb) => eb.and({ id: folderId, ownerId }))
            .returningAll()
            .executeTakeFirst()
    }
}
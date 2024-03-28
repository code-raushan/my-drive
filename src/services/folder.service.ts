import { BadRequestError } from "../errors/bad-request.error";
import { FolderRepository } from "../repositories/folder.repository";

class FolderService {
    constructor(private readonly _folderRepository: FolderRepository) {

    }

    async createFolder(params: { ownerId: string, folderName: string }) {
        const { ownerId, folderName } = params;

        const folder = await this._folderRepository.createFolder({ ownerId, folderName });
        if (!folder) throw new BadRequestError("Failed to create folder");

        return folder;
    }

    async createSubFolder(params: { ownerId: string, parentFolderId: string, folderName: string }) {
        const { folderName, ownerId, parentFolderId } = params;

        const subFolder = await this._folderRepository.createSubFolder({ ownerId, parentFolderId, folderName });
        if (!subFolder) throw new BadRequestError("Failed to create subfolder");

        return subFolder;
    }

    async listSubFolders(params: { ownerId: string, folderId: string }) {
        const { ownerId, folderId } = params;

        const list = await this._folderRepository.listSubFolders({ ownerId, folderId });
        if (!list || list.length === 0) throw new BadRequestError("Failed to list the subfolders or no subfolder exists");

        return list;
    }

    async listAllFolders(ownerId: string) {
        const foldersList = await this._folderRepository.listAllFolders(ownerId);
        if (!foldersList || foldersList.length === 0) throw new BadRequestError("Failed to list all folders or no folder exists");

        return foldersList;
    }

    async deleteFolder(params: { ownerId: string, folderId: string }) {
        const { ownerId, folderId } = params;

        // TODO
        // S3 files deletion of the folder

        // DB Record Deletion
        const deletedFolder = await this._folderRepository.deleteFolder({ ownerId, folderId });
        if (!deletedFolder) throw new BadRequestError("Failed to delete the folder");

        return deletedFolder;
    }

    async updateFolderName(params: { ownerId: string, folderId: string, newFolderName: string }) {
        const { ownerId, folderId, newFolderName } = params;

        const updatedFolder = await this._folderRepository.updateFolder({ ownerId, folderId, newFolderName });
        if (!updatedFolder) throw new BadRequestError("Failed to update the folder name");

        return updatedFolder;
    }
}

export default new FolderService(new FolderRepository());


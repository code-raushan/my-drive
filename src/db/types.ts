import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type File = {
    id: string;
    fileName: string;
    folderId: string | null;
    s3Key: string;
    ownerId: string;
    size: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type Folder = {
    id: string;
    folderName: string;
    parentFolderId: string | null;
    ownerId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type User = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string;
};
export type UserSession = {
    id: string;
    phoneNumber: string;
    otp: string;
    session: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type DB = {
    File: File;
    Folder: Folder;
    User: User;
    UserSession: UserSession;
};

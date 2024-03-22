declare namespace Express {
    export interface Request {
        user: {
            id: string,
        },
    }
}

declare module "xss-clean";
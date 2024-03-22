declare namespace Express {
    export interface Request {
        user: {
            _id: string,
        },
    }
}

declare module "xss-clean";
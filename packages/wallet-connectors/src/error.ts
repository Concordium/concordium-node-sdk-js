export class UnreachableCaseError extends Error {
    constructor(
        readonly type: string,
        readonly val: never
    ) {
        super(`invalid ${type} kind '${val}`);
    }
}

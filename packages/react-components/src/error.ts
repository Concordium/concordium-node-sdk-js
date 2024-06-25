export function errorString(err: any): string {
    return (err as Error).message || (err as string);
}

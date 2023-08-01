export function setErrorString(setError: (err: string) => void) {
    return (err: any) => setError(errorString(err));
}

export function errorString(err: any): string {
    return (err as Error).message || (err as string);
}

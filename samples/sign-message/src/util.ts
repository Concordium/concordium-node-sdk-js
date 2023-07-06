export function setErrorString(setError: (err: string) => void) {
    return (err: any) => setError(errorString(err));
}

export function errorString(err: any): string {
    if (err instanceof Error) {
        return err.message;
    }
    return err.toString();
}

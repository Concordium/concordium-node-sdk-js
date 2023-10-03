// `fetch` is actually available in nodeJS, type is not available though.
declare function fetch(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response>;

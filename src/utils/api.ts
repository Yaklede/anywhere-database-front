// utils/api.ts
const apiUrl = process.env.NEXT_PUBLIC_API_URL

export const getDatabaseSchema = async (
    host: string,
    port: number,
    username: string,
    password: string,
    driver: string,
) => {

    const response = await fetch(`${apiUrl}/api/v1/databases/connect`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            url: host,
            port: port,
            password: password,
            username: username,
            driver: driver,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch schema');
    }

    return response.json();
};

export const executeQuery = async (
    host: string,
    port: number,
    username: string,
    password: string,
    driver: string,
    query: string
) => {
    const response = await fetch(`${apiUrl}/api/v1/databases/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            connectInfo: {
                url: host,
                port: port,
                password: password,
                username: username,
                driver: driver,
            },
            sql: query
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to execute query');
    }

    return response.json();
};

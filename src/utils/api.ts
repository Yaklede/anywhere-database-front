// utils/api.ts
const apiUrl = process.env.NEXT_PUBLIC_API_URL

export const getDatabaseSchema = async (
    host: string,
    port: number,
    username: string,
    password: string,
    driver: string,
    database: string
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
            database: database,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch schema');
    }

    return response.json();
};

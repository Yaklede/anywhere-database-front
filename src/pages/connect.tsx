import useConnectStore from "@/stores/ConnectStore";
import React from "react";
import {useRouter} from 'next/router';
import {getDatabaseSchema} from "@/utils/api";
import useQueryStore from "@/stores/QueryStore"; // Adjust path if needed

const ConnectPage = () => {
    const {
        host,
        port,
        username,
        password,
        driver,
        database,
        setHost,
        setPort,
        setUsername,
        setPassword,
        setDriver,
        setDatabase
    } = useConnectStore();

    const {setSchema} = useQueryStore();

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const schemaData = await getDatabaseSchema(host, port, username, password, driver, database);
            setSchema(schemaData)
            router.push('/editor'); // Navigate to EditorPage
        } catch (error) {
            console.error('Error connecting to database:', error);
        }
    };

    return (
        <div className="container">
            <h1>Database Connection Form</h1>
            <form onSubmit={handleSubmit} className="form">
                <div className="form-group">
                    <label htmlFor="host">Host</label>
                    <input
                        type="text"
                        id="host"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="port">Port</label>
                    <input
                        type="number"
                        id="port"
                        value={port}
                        onChange={(e) => setPort(Number(e.target.value))}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="driver">Database Driver</label>
                    <input
                        type="text"
                        id="driver"
                        value={driver}
                        onChange={(e) => setDriver(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="database">Database</label>
                    <input
                        type="text"
                        id="database"
                        value={database}
                        onChange={(e) => setDatabase(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="submit-button">Connect</button>
            </form>
            <style jsx>{`
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background-color: #f9f9f9;
                }

                h1 {
                    text-align: center;
                    margin-bottom: 20px;
                }

                .form {
                    display: flex;
                    flex-direction: column;
                }

                .form-group {
                    margin-bottom: 15px;
                }

                label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                }

                input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }

                .submit-button {
                    background-color: #0070f3;
                    color: white;
                    border: none;
                    padding: 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                }

                .submit-button:hover {
                    background-color: #005bb5;
                }
            `}</style>
        </div>
    );
};

export default ConnectPage;

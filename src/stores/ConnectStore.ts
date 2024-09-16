import {create} from 'zustand';

interface ConnectStore {
    host: string;
    port: number;
    username: string;
    password: string;
    driver: string;
    database: string;
    setHost: (host: string) => void;
    setPort: (port: number) => void;
    setUsername: (username: string) => void;
    setPassword: (password: string) => void;
    setDriver: (driver: string) => void;
    setDatabase: (database: string) => void
}

const useConnectStore = create<ConnectStore>((set) => ({
    host: '',
    port: 3306,
    username: '',
    password: '',
    driver: '',
    database: '',
    setDatabase: (database) => set({database}),
    setHost: (host) => set({host}),
    setPort: (port) => set({port}),
    setUsername: (username) => set({username}),
    setPassword: (password) => set({password}),
    setDriver: (driver) => set({driver}),
}));

export default useConnectStore;
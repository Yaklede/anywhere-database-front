import { create } from 'zustand';

interface QueryStore {
    query: string;
    setQuery: (newQuery: string) => void;
    schema: Record<string, Record<string, Column[]>> | null; // Schema data
    setSchema: (data: Record<string, Record<string, Column[]>> | null) => void; // Set schema
    table: any | null; // Query result data
    setTable: (data: any | null) => void; // Set table data
}

const useQueryStore = create<QueryStore>((set) => ({
    query: '',
    setQuery: (newQuery: string) => set({ query: newQuery }),
    schema: null,
    setSchema: (data: Record<string, Record<string, Column[]>> | null) => set({ schema: data }),
    table: null,
    setTable: (data: any | null) => set({ table: data }),
}));

export default useQueryStore;

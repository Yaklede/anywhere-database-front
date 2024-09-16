import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import useQueryStore from '@/stores/QueryStore';
import useConnectStore from '@/stores/ConnectStore';
import { getDatabaseSchema } from '@/utils/api';

// Dynamically import AceEditor with SSR disabled
const AceEditor = dynamic(() => import('react-ace'), { ssr: false });

const EditorPage = () => {
    const router = useRouter();
    const { query, setQuery, schema, setSchema, table, setTable } = useQueryStore();
    const { host, port, username, password, driver, database } = useConnectStore();
    const [expandedDatabases, setExpandedDatabases] = useState<Record<string, boolean>>({});
    const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
    const [editor, setEditor] = useState<any>(null);

    useEffect(() => {
        if (!host || !port || !username || !password || !driver || !database) {
            router.push('/');
            return;
        }

        const fetchSchema = async () => {
            try {
                const schemaData = await getDatabaseSchema(host, port, username, password, driver, database);
                setSchema(schemaData);

                // Generate autocomplete suggestions
                const suggestions = generateAutocompleteSuggestions(schemaData);
                setAutocompleteSuggestions(suggestions);
            } catch (error) {
                console.error('Error fetching schema:', error);
            }
        };

        fetchSchema();
    }, [host, port, username, password, driver, database, setSchema, router]);

    const generateAutocompleteSuggestions = (schemaData: Record<string, Record<string, Column[]>>) => {
        const suggestions: string[] = [];

        for (const databaseName in schemaData) {
            suggestions.push(databaseName);
            for (const tableName in schemaData[databaseName]) {
                suggestions.push(tableName);
                schemaData[databaseName][tableName].forEach((field) => {
                    suggestions.push(field.columnName);
                });
            }
        }

        // Add common SQL keywords
        const sqlKeywords = [
            'SELECT', 'FROM', 'WHERE', 'JOIN', 'ON', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TABLE'
        ];
        suggestions.push(...sqlKeywords);

        return suggestions;
    };

    // Custom autocomplete completer
    const customCompleter = {
        getCompletions: (editor: any, session: any, position: any, prefix: string, callback: (err: any, completions: any[]) => void) => {
            if (prefix.length === 0) {
                callback(null, []);
                return;
            }

            const completions = autocompleteSuggestions
                .filter(suggestion => suggestion.toLowerCase().startsWith(prefix.toLowerCase())) // Filter suggestions based on prefix
                .map(suggestion => ({
                    caption: suggestion,
                    value: suggestion,
                    meta: 'autocomplete'
                }));
            callback(null, completions);
        }
    };

    useEffect(() => {
        // Ensure this runs only in the browser (client-side)
        if (typeof window !== 'undefined' && editor) {
            // Dynamically load Ace build and language tools
            const loadAceModules = async () => {
                try {
                    const ace = await import('ace-builds/src-noconflict/ace');
                    await import('ace-builds/src-noconflict/mode-sql');
                    await import('ace-builds/src-noconflict/theme-github');
                    await import('ace-builds/src-noconflict/ext-language_tools');

                    const langTools = ace.require('ace/ext/language_tools');
                    langTools.addCompleter(customCompleter);

                } catch (error) {
                    console.error('Error loading Ace modules:', error);
                }
            };

            loadAceModules();
        }
    }, [editor, autocompleteSuggestions]);

    // Submit the query
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const response = await fetch('/api/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });

        const data = await response.json();
        setTable(data);
    };

    // Toggle database display
    const toggleDatabase = (databaseName: string) => {
        setExpandedDatabases((prev) => ({
            ...prev,
            [databaseName]: !prev[databaseName],
        }));
    };

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <div style={{ width: '30%', padding: '20px', borderRight: '1px solid #ddd', overflowY: 'auto' }}>
                <h2>Database Schema</h2>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {schema && Object.keys(schema).map((databaseName) => (
                        <li key={databaseName} style={{ marginBottom: '10px' }}>
                            <div
                                style={{ cursor: 'pointer', fontWeight: 'bold' }}
                                onClick={() => toggleDatabase(databaseName)}
                            >
                                {databaseName} {expandedDatabases[databaseName] ? '[-]' : '[+]'}
                            </div>
                            {expandedDatabases[databaseName] && (
                                <ul style={{ listStyleType: 'none', paddingLeft: '20px' }}>
                                    {Object.keys(schema[databaseName]).map((tableName) => (
                                        <li key={tableName} style={{ marginBottom: '10px' }}>
                                            <div
                                                style={{ cursor: 'pointer', fontWeight: 'bold' }}
                                                onClick={() => toggleDatabase(`${databaseName}-${tableName}`)}
                                            >
                                                {tableName} {expandedDatabases[`${databaseName}-${tableName}`] ? '[-]' : '[+]'}
                                            </div>
                                            {expandedDatabases[`${databaseName}-${tableName}`] && (
                                                <ul style={{ listStyleType: 'none', paddingLeft: '20px' }}>
                                                    {schema[databaseName][tableName].map((field, index) => (
                                                        <li key={index}>{`${field.columnName}: ${field.dataType}`}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                <h1>SQL Query Editor</h1>
                <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
                    <AceEditor
                        mode="sql"
                        theme="github"
                        name="sql-editor"
                        width="100%"
                        height="400px"
                        value={query}
                        onChange={(value) => setQuery(value || '')}
                        editorProps={{ $blockScrolling: true }}
                        setOptions={{
                            enableBasicAutocompletion: true,
                            enableLiveAutocompletion: true,
                            enableSnippets: true,
                        }}
                        onLoad={(editor) => setEditor(editor)} // Save the editor instance
                    />
                    <button
                        type="submit"
                        style={{
                            marginTop: '10px',
                            padding: '10px 20px',
                            background: '#0070f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                        }}
                    >
                        Execute Query
                    </button>
                </form>

                {table && (
                    <div>
                        <h2>Query Result</h2>
                        <pre style={{ backgroundColor: '#f7f7f7', padding: '10px', borderRadius: '5px' }}>
                            {JSON.stringify(table, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditorPage;

import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import dynamic from 'next/dynamic';
import useQueryStore from '@/stores/QueryStore';
import useConnectStore from '@/stores/ConnectStore';
import {executeQuery, getDatabaseSchema} from '@/utils/api';
import {Parser} from 'node-sql-parser';
import Table from "@/components/Table"; // SQL parser

// Dynamically import AceEditor with SSR disabled
const AceEditor = dynamic(() => import('react-ace'), {ssr: false});

const EditorPage = () => {
    const router = useRouter();
    const {query, setQuery, schema, setSchema, table, setTable} = useQueryStore();
    const {host, port, username, password, driver} = useConnectStore();
    const [expandedDatabases, setExpandedDatabases] = useState<Record<string, boolean>>({});
    const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
    const [editor, setEditor] = useState<any>(null);
    const sqlParser = new Parser(); // Initialize SQL parser

    useEffect(() => {
        if (!host || !port || !username || !password || !driver) {
            router.push('/');
            return;
        }

        const fetchSchema = async () => {
            try {
                const schemaData = await getDatabaseSchema(host, port, username, password, driver);
                setSchema(schemaData);

                // Generate autocomplete suggestions
                const suggestions = generateAutocompleteSuggestions(schemaData);
                setAutocompleteSuggestions(suggestions);
            } catch (error) {
                console.error('Error fetching schema:', error);
            }
        };

        fetchSchema();
    }, [host, port, username, password, driver, setSchema, router]);

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

        const sqlKeywords = [
            'SELECT', 'FROM', 'WHERE', 'JOIN', 'ON', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TABLE'
        ];
        suggestions.push(...sqlKeywords);

        return suggestions;
    };

    // SQL parsing and error checking function
    const parseSQL = (sql: string) => {
        try {
            sqlParser.astify(sql); // Try parsing the query
            editor.getSession().clearAnnotations(); // Clear any existing annotations if valid
        } catch (error: any) {
            const errorLine = error.location?.start?.line || 0;
            editor.getSession().setAnnotations([{
                row: errorLine - 1, // Ace is 0-indexed, parser is 1-indexed
                column: 0,
                text: error.message, // Error message from parser
                type: 'error', // Highlight as error
            }]);
        }
    };

    // Custom autocomplete completer
    const customCompleter = {
        getCompletions: (editor: any, session: any, position: any, prefix: string, callback: (err: any, completions: any[]) => void) => {
            if (prefix.length === 0) {
                callback(null, []);
                return;
            }

            const completions = autocompleteSuggestions
                .filter(suggestion => suggestion.toLowerCase().startsWith(prefix.toLowerCase()))
                .map(suggestion => ({
                    caption: suggestion,
                    value: suggestion,
                    meta: 'autocomplete'
                }));
            callback(null, completions);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && editor) {
            const loadAceModules = async () => {
                try {
                    const ace = await import('ace-builds/src-noconflict/ace');
                    await import('ace-builds/src-noconflict/mode-sql');
                    await import('ace-builds/src-noconflict/theme-github');
                    await import('ace-builds/src-noconflict/ext-language_tools');

                    // SQL 구문에 대해 커스텀 하이라이팅 규칙을 적용
                    const langTools = ace.require('ace/ext/language_tools');
                    const CustomHighlightRules = ace.require('ace/mode/sql_highlight_rules').SqlHighlightRules;

                    class CustomSQLHighlightRules extends CustomHighlightRules {
                        constructor() {
                            super();

                            // 키워드와 테이블 이름에 대한 토큰 매핑
                            const keywordMapper = this.createKeywordMapper({
                                'keyword': 'SELECT|FROM|WHERE|JOIN|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TABLE',
                                'constant.language': 'NULL|TRUE|FALSE',
                                'operator': '\\*',  // 연산자 하이라이팅
                                'black-table': autocompleteSuggestions.join('|') // FROM 뒤 테이블 이름 하이라이팅 (검은색)
                            }, 'identifier', true);

                            this.$rules = {
                                'start': [
                                    {
                                        token: 'keyword', // 주황색 키워드
                                        regex: '\\b(?:SELECT|FROM|WHERE|JOIN|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TABLE)\\b'
                                    },
                                    {
                                        token: 'operator', // 연산자는 노란색
                                        regex: '\\*'
                                    },
                                    {
                                        token: 'identifier', // 필드 이름은 분홍색
                                        regex: '[a-zA-Z_$][a-zA-Z0-9_$]*'
                                    },
                                    {
                                        token: 'constant.language', // 조건절 (NULL, TRUE, FALSE 등)
                                        regex: '\\b(?:NULL|TRUE|FALSE)\\b'
                                    },
                                    { token: 'constant.numeric', regex: '[0-9]+' }, // 숫자는 기본색
                                    { token: 'text', regex: '\\s+' } // 공백 처리
                                ]
                            };
                        }
                    }

                    const customMode = ace.require('ace/mode/sql').Mode;
                    customMode.prototype.HighlightRules = CustomSQLHighlightRules;
                    langTools.addCompleter(customCompleter);  // 커스텀 자동완성 기능
                    editor.session.setMode(new customMode());

                    // 스타일 설정
                    const stylesheet = document.createElement('style');
                    stylesheet.innerHTML = `
                        .ace_keyword {
                            color: orange !important;  /* 주황색 키워드 */
                        }
                        .ace_operator {
                            color: black !important;  /* 연산자는 노란색 */
                        }
                        .ace_identifier {
                            color: black !important;  /* 필드 식별자는 분홍색 */
                        }
                        .ace_constant.ace_language {
                            color: lightpink !important;  /* 조건절 분홍색 */
                        }
                        .ace_black-table {
                            color: black !important;  /* 테이블 이름은 검은색 */
                        }
                    `;
                    document.head.appendChild(stylesheet);
                } catch (error) {
                    console.error('Ace 모듈 로딩 오류:', error);
                }
            };

            loadAceModules();
        }
    }, [customCompleter, editor]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const response = await executeQuery(
            host,
            port,
            username,
            password,
            driver,
            query
        )
        setTable(response);
    };

    const toggleDatabase = (databaseName: string) => {
        setExpandedDatabases((prev) => ({
            ...prev,
            [databaseName]: !prev[databaseName],
        }));
    };

    return (
        <div style={{display: 'flex', height: '100vh'}}>
            <div style={{width: '30%', padding: '20px', borderRight: '1px solid #ddd', overflowY: 'auto'}}>
                <h2>Database Schema</h2>
                <ul style={{listStyleType: 'none', padding: 0}}>
                    {schema && Object.keys(schema).map((databaseName) => (
                        <li key={databaseName} style={{marginBottom: '10px'}}>
                            <div
                                style={{cursor: 'pointer', fontWeight: 'bold'}}
                                onClick={() => toggleDatabase(databaseName)}
                            >
                                {databaseName} {expandedDatabases[databaseName] ? '[-]' : '[+]'}
                            </div>
                            {expandedDatabases[databaseName] && (
                                <ul style={{listStyleType: 'none', paddingLeft: '20px'}}>
                                    {Object.keys(schema[databaseName]).map((tableName) => (
                                        <li key={tableName} style={{marginBottom: '10px'}}>
                                            <div
                                                style={{cursor: 'pointer', fontWeight: 'bold'}}
                                                onClick={() => toggleDatabase(`${databaseName}-${tableName}`)}
                                            >
                                                {tableName} {expandedDatabases[`${databaseName}-${tableName}`] ? '[-]' : '[+]'}
                                            </div>
                                            {expandedDatabases[`${databaseName}-${tableName}`] && (
                                                <ul style={{listStyleType: 'none', paddingLeft: '20px'}}>
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
            <div style={{flex: 1, padding: '20px', overflowY: 'auto'}}>
                <h1>SQL Query Editor</h1>
                <form onSubmit={handleSubmit} style={{marginBottom: '20px'}}>
                    <AceEditor
                        mode="sql"
                        theme="github"
                        name="sql-editor"
                        width="100%"
                        height="400px"
                        value={query}
                        onChange={(value) => {
                            setQuery(value || '');
                            parseSQL(value || ''); // Parse SQL and check for errors
                        }}
                        editorProps={{$blockScrolling: true}}
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
                        <Table data={table}/>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditorPage;

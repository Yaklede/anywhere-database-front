import dynamic from 'next/dynamic';
import { FC } from 'react';

const AceEditor = dynamic(() => import('react-ace'), { ssr: false });

interface SqlEditorProps {
    query: string;
    onChange: (value: string) => void;
}

const SqlEditor: FC<SqlEditorProps> = ({ query, onChange }) => (
    <AceEditor
        mode="sql"
        theme="github"
        name="sql-editor"
        width="100%"
        height="200px"
        value={query}
        onChange={(value) => onChange(value || '')}
        editorProps={{ $blockScrolling: true }}
    />
);

export default SqlEditor;

const Table = ({ data }: { data: any[] }) => {
    if (data.length === 0) return <p>No results</p>;

    const headers = Object.keys(data[0]);

    return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
            <tr>
                {headers.map((header) => (
                    <th key={header} style={{ border: '1px solid #ddd', padding: '4px' }}>
                        {header}
                    </th>
                ))}
            </tr>
            </thead>
            <tbody>
            {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                    {headers.map((header) => (
                        <td key={header} style={{ border: '1px solid #ddd', padding: '4px' }}>
                            {row[header]}
                        </td>
                    ))}
                </tr>
            ))}
            </tbody>
        </table>
    );
};

export default Table;

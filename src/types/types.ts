interface Column {
    columnName: string;
    dataType: string;
}

interface TableSchema {
    tables: Column[];
}
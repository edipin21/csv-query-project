

interface QueryResultsTableProps {
    columns: string[];
    rows: any[];
    visibleRows: number;
    onShowMore?: () => void;

}

export default function ResultTable({ columns, rows, visibleRows, onShowMore }: QueryResultsTableProps) {

    return (
        <div className="w-full max-w-7xl px-4">
            <h2 className="text-xl font-semibold mb-2">Query Results</h2>
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200">
                <table className="table-auto border-collapse w-full text-left text-sm">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col} className="border px-2 py-1 bg-gray-100">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.slice(0, visibleRows).map((row, rowIndex) => (
                            <tr key={rowIndex} className="even:bg-gray-50">
                                {columns.map((col) => (
                                    <td key={col} className="border px-2 py-1 align-top">
                                        <div
                                            className="max-h-[120px] max-w-[300px] overflow-auto whitespace-pre-wrap"
                                            title={String(row[col])}
                                        >
                                            {String(row[col])}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {visibleRows < rows.length && onShowMore && (
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={onShowMore}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"

                    >
                        הצג עוד תוצאות
                    </button>
                </div>
            )}
        </div>

    );
};



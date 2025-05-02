// import { useState } from "react";
// import ResultTable from "./components/result-table";
// import './index.css';
// import { validateInputs } from './validate';


// export interface FormData {
//   csvUrl: string;
//   query: string;
// }

// export default function CSVQueryPage() {

//   const [inputsErrors, setInputsErrors] = useState<{ csvUrl?: string; query?: string }>({});
//   const [result, setResult] = useState<{ columns: string[]; rows: any[] }>({ columns: [], rows: [] });
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [visibleRows, setVisibleRows] = useState(0);
//   const [lastSubmittedData, setLastSubmittedData] = useState<FormData | null>(null);
//   const [alreadyDisplayedMessage, setAlreadyDisplayedMessage] = useState("");

//   const [serverError, setServerError] = useState("");

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     const formData = new FormData(e.target as HTMLFormElement);
//     const csvUrl = formData.get("csvUrl")?.toString().trim() || "";
//     const query = formData.get("query")?.toString().trim() || "";
//     const { isValid, errors } = validateInputs(csvUrl, query);

//     if (!isValid) {
//       setInputsErrors(errors);
//       return;
//     }
//     setInputsErrors({});

//     if (
//       lastSubmittedData &&
//       lastSubmittedData.csvUrl === csvUrl &&
//       lastSubmittedData.query === query
//     ) {
//       setAlreadyDisplayedMessage("Results for this query are already displayed.");
//       return;
//     }


//     try {
//       setIsSubmitting(true);
//       setServerError("");
//       setAlreadyDisplayedMessage("");

//       const res = await fetch("/run-query", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ csvUrl, query }),
//       });

//       if (!res.ok) {
//         const { error } = await res.json();
//         throw new Error(error || "Failed to execute query.");
//       }

//       const data = await res.json();

//       setResult(data);
//       setAlreadyDisplayedMessage("");
//       setLastSubmittedData({ csvUrl, query });
//       setVisibleRows(Math.min(10, data.rows.length));

//     } catch (err: any) {
//       setLastSubmittedData({ csvUrl, query });
//       setAlreadyDisplayedMessage("");
//       setResult({ columns: [], rows: [] });
//       setServerError(err.message || "Unknown error");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };


//   return (
//     <div className="flex flex-col items-center min-h-screen p-4">
//       <h1 className="text-4xl mt-10 font-bold mb-4">CSV SQL Query Tool</h1>
//       <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
//         <div className="flex flex-col">
//           <label htmlFor="csv-url" className="font-medium">
//             CSV URL:
//           </label>
//           <input
//             id="csv-url"
//             name="csvUrl"
//             type="text"
//             placeholder="https://example.com/data.csv"
//             disabled={isSubmitting}
//             className={`border p-2 rounded mb-1 ${inputsErrors.csvUrl ? "border-red-500" : ""} ${isSubmitting ? "bg-gray-100 cursor-not-allowed" : ""}`}
//           />
//           {inputsErrors.csvUrl && <span className="text-red-500 text-sm mb-3">{inputsErrors.csvUrl}</span>}

//           <label htmlFor="query" className="font-medium">
//             Query:
//           </label>
//           <textarea
//             id="query"
//             name="query"
//             placeholder="SELECT * FROM data WHERE age > 30 ORDER BY name ASC;"
//             disabled={isSubmitting}
//             className={`border p-2 rounded min-h-[100px] ${inputsErrors.query ? "border-red-500" : ""} ${isSubmitting ? "bg-gray-100 cursor-not-allowed" : ""}`}
//           />
//           {inputsErrors.query && <span className="text-red-500 text-sm mt-3">{inputsErrors.query}</span>}
//         </div>

//         {!isSubmitting ? (
//           <button
//             type="submit"
//             className="bg-blue-500 text-white p-2 rounded mt-4 hover:bg-blue-600 w-full"
//           >
//             Run Query
//           </button>
//         ) : (
//           <div className="flex justify-center mt-4">
//             <svg
//               className="animate-spin h-6 w-6 text-blue-500"
//               xmlns="http://www.w3.org/2000/svg"
//               fill="none"
//               viewBox="0 0 24 24"
//             >
//               <circle
//                 className="opacity-25"
//                 cx="12"
//                 cy="12"
//                 r="10"
//                 stroke="currentColor"
//                 strokeWidth="4"
//               ></circle>
//               <path
//                 className="opacity-75"
//                 fill="currentColor"
//                 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
//               ></path>
//             </svg>
//           </div>
//         )}
//       </form>

//       {alreadyDisplayedMessage && (
//         <p className="text-yellow-600 font-medium mt-4">
//           {alreadyDisplayedMessage}
//         </p>
//       )}

//       {serverError && (
//         <p className="text-red-600 font-semibold mt-4">{serverError}</p>
//       )}

//       {!serverError && result && result.rows.length > 0 && (
//         <div className="mt-8 w-full flex justify-center">
//           <ResultTable columns={result.columns} rows={result.rows} visibleRows={visibleRows} onShowMore={() => setVisibleRows((prev) => Math.min(prev + 10, result.rows.length))} />
//         </div>
//       )}
//     </div >
//   );
// }

import { useState } from "react";
import ResultTable from "./components/result-table";
import './index.css';
import { validateInputs } from './validate';

export interface FormData {
  csvUrl: string;
  query: string;
}

const MAX_VISIBLE_ROWS = 10;

export default function CSVQueryPage() {
  const [inputsErrors, setInputsErrors] = useState<Partial<FormData>>({});
  const [result, setResult] = useState<{ columns: string[]; rows: any[] }>({ columns: [], rows: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleRows, setVisibleRows] = useState(0);
  const [lastSubmittedData, setLastSubmittedData] = useState<FormData | null>(null);
  const [alreadyDisplayedMessage, setAlreadyDisplayedMessage] = useState("");
  const [serverError, setServerError] = useState("");

  const extractFormData = (form: HTMLFormElement): FormData => {
    const formData = new FormData(form);
    return {
      csvUrl: (formData.get("csvUrl")?.toString().trim() || ""),
      query: (formData.get("query")?.toString().trim() || ""),
    };
  };

  const isDuplicateSubmission = (data: FormData) =>
    lastSubmittedData &&
    lastSubmittedData.csvUrl === data.csvUrl &&
    lastSubmittedData.query === data.query;

  const fetchQueryResults = async (data: FormData) => {
    const res = await fetch("/run-query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || "Failed to execute query.");
    }

    return res.json();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    const data = extractFormData(formElement);
    const { isValid, errors } = validateInputs(data.csvUrl, data.query);

    if (!isValid) {
      setInputsErrors(errors);
      return;
    }

    setInputsErrors({});

    if (isDuplicateSubmission(data)) {
      setAlreadyDisplayedMessage("Results for this query are already displayed.");
      return;
    }
    setServerError("");

    try {
      setIsSubmitting(true);
      setAlreadyDisplayedMessage("");

      const resultData = await fetchQueryResults(data);
      setResult(resultData);
      setLastSubmittedData(data);
      setVisibleRows(Math.min(MAX_VISIBLE_ROWS, resultData.rows.length));
    } catch (err: any) {
      setResult({ columns: [], rows: [] });
      setServerError(err.message || "Unknown error");
      setLastSubmittedData(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSubmitButton = () => {
    if (isSubmitting) {
      return (
        <div className="flex justify-center mt-4">
          <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      );
    }

    return (
      <button type="submit" className="bg-blue-500 text-white p-2 rounded mt-4 hover:bg-blue-600 w-full">
        Run Query
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4">
      <h1 className="text-4xl mt-10 font-bold mb-4">CSV SQL Query Tool</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
        <div className="flex flex-col">
          <label htmlFor="csv-url" className="font-medium">CSV URL:</label>
          <input
            id="csv-url"
            name="csvUrl"
            type="text"
            placeholder="https://example.com/data.csv"
            disabled={isSubmitting}
            className={`border p-2 rounded mb-1 ${inputsErrors.csvUrl ? "border-red-500" : ""} ${isSubmitting ? "bg-gray-100 cursor-not-allowed" : ""}`}
          />
          {inputsErrors.csvUrl && <span className="text-red-500 text-sm mb-3">{inputsErrors.csvUrl}</span>}

          <label htmlFor="query" className="font-medium">Query:</label>
          <textarea
            id="query"
            name="query"
            placeholder="SELECT * FROM data WHERE age > 30 ORDER BY name ASC;"
            disabled={isSubmitting}
            className={`border p-2 rounded min-h-[100px] ${inputsErrors.query ? "border-red-500" : ""} ${isSubmitting ? "bg-gray-100 cursor-not-allowed" : ""}`}
          />
          {inputsErrors.query && <span className="text-red-500 text-sm mt-3">{inputsErrors.query}</span>}
        </div>

        {renderSubmitButton()}
      </form>

      {alreadyDisplayedMessage && (
        <p className="text-yellow-600 font-medium mt-4">{alreadyDisplayedMessage}</p>
      )}

      {serverError && (
        <p className="text-red-600 font-semibold mt-4">{serverError}</p>
      )}

      {!serverError && result.rows.length > 0 && (
        <div className="mt-8 w-full flex justify-center">
          <ResultTable
            columns={result.columns}
            rows={result.rows}
            visibleRows={visibleRows}
            onShowMore={() => setVisibleRows((prev) => Math.min(prev + MAX_VISIBLE_ROWS, result.rows.length))}
          />
        </div>
      )}
    </div>
  );
}

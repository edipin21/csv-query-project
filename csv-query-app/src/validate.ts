export interface ValidationResult {
    isValid: boolean;
    errors: {
        csvUrl?: string;
        query?: string;
    };
}

export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

export function validateInputs(csvUrl?: string, query?: string): ValidationResult {
    const errors: ValidationResult['errors'] = {};

    if (!csvUrl) {
        errors.csvUrl = "CSV URL is required.";
    } else if (!isValidUrl(csvUrl)) {
        errors.csvUrl = "Invalid URL.";
    }

    if (!query) {
        errors.query = "SQL query is required.";
    } else if (!query.toLowerCase().startsWith("select")) {
        errors.query = "Query must start with SELECT.";
    } else if (!query.toLowerCase().includes("from data")) {
        errors.query = "Query must include 'from data' clause.";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

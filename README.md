# CSV SQL Query Tool

A full-stack web application that allows users to enter the URL of a CSV file and run SQL queries against it.  
Built with React on the frontend and Node.js, Express, and AlaSQL on the backend,  
the app provides an interactive UI for querying CSV data using standard SQL syntax.

## ✨ Features

- 🧾 Input any CSV file URL and write SQL queries against the data
- 🧠 SQL validation to ensure safe and accurate query execution
- ⚡ Query results are displayed in a responsive and paginated table
- 📥 CSV content is fetched, parsed, and cached on the backend
- 🚫 Prevents duplicate submissions and invalid input
- 🧹 Automatic cache invalidation after 5 minutes

## 🛠 Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + AlaSQL + csv-parse

## ▶️ How to Run

1. Open the project in CodeSandbox
2. Open the terminal (bottom panel)
3. Run: `npm start`
4. The app will start, and you can begin querying CSV files!

## 🧪 Example Usage

1. Enter this CSV URL:  
   [CSV URL Example](https://raw.githubusercontent.com/ngshiheng/michelin-my-maps/main/data/michelin_my_maps.csv)
2. Enter the following query:
   ```sql
   SELECT Location, COUNT(Name) AS Restaurants
   FROM data
   WHERE Location LIKE "%France"
   GROUP BY Location
   HAVING COUNT(Name) > 15
   ORDER BY Restaurants DESC;
   ```

3.Click submit to see the results.

© Eddie Abramov, 2025

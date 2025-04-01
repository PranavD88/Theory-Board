# Theory Board

Theory Board is a personal knowledge management system that allows users to create, link, and manage notes in a graph-based interface.

To get started, ensure you have Node.js (v16 or higher), npm (which comes with Node.js), and PostgreSQL (v12 or higher) installed on your system. First, clone the repository using `git clone <repository-url>` and navigate to the project directory using `cd scpj2`.

For the backend setup, navigate to the `backend` directory and install the required dependencies by running `npm install`. Create a `.env` file in the `backend` directory with the necessary environment variables, including your database credentials (`DB_USER`, `DB_PASS`, `DB_HOST`, `DB_NAME`, `DB_PORT`) and a `JWT_SECRET` for authentication. Once the environment variables are configured, run the database migrations or set up the schema manually. Start the backend server using `npm run dev`, which will run on `http://localhost:5000`.

For the frontend setup, navigate to the `frontend` directory and install its dependencies by running `npm install`. Start the frontend development server using `npm start`, which will run on `http://localhost:3000`.

To run the application, ensure the backend server is running on `http://localhost:5000` and open the frontend in your browser at `http://localhost:3000`. You can register a new account or log in to start using Theory Board.

Make sure your PostgreSQL database is running and accessible with the credentials provided in the `.env` file. The project uses TypeScript, React, Express, and PostgreSQL, so ensure all dependencies are installed in both the `backend` and `frontend` directories. Keep your `.env` file secure and avoid committing it to version control.

For backend scripts, use `npm run dev` to start the server in development mode, `npm run build` to compile TypeScript files, and `npm start` to run the compiled server. For frontend scripts, use `npm start` to start the development server, `npm run build` to build the frontend for production, and `npm test` to run tests.

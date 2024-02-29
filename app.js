// Import required modules
const http = require("http");
const express = require("express");
const SwaggerExpress = require("swagger-express-mw");

// Load environment configuration
const configuration = require("./config/environment.js");

// Load socket API interface
const socketApi = require("./api/interfaces/socketApi");

// Create Express app instance
const app = express();

// Create HTTP server instance
const server = http.createServer(app);

// Set up Swagger configuration object
const config = { appRoot: __dirname };

// If CORS is enabled, add middleware to handle CORS headers
if (configuration.enableCorsInsecurely) {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
  });
}

// Define the function that sets up and starts the server
const startServer = () => {
  // Create and register Swagger instance with the app
  SwaggerExpress.create(config, (err, swaggerExpress) => {
    if (err) {
      throw err;
    }

    swaggerExpress.register(app);

    // Get port from configuration file and start server on that port
    const port = configuration.mainPort;
    console.log("Server listening on port:", port);
    server.listen(port);

    // Make sockets available through server instance
    socketApi.makeSocket(server);
  });
};

// Establish database connection and start server
require("./config/dbConnection")({}, (err, _db) => {
  if (err) {
    console.error("Error establishing database connection:", err);
    return;
  }

  // Import necessary services
  require("./api/services/mailAutoServices");
  require("./api/services/deleteArchiveAutoServices");

  // Start server
  startServer();
});

// Export the Express app instance for use in other modules
module.exports = app;

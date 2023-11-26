const express = require("express");
const session = require("express-session");
const app = express();
const { Client, types } = require("cassandra-driver");
const { v4: uuidv4 } = require("uuid");

const cors = require("cors");
require("dotenv").config();

const client = new Client({
  cloud: {
    secureConnectBundle: "secure-connect-todoapp.zip", 
  },
  credentials: {
    username: process.env.ASTRA_DB_CLIENT_ID,
    password: process.env.ASTRA_DB_CLIENT_SECRET,
  },
});

app.use(express.json());
app.use(session({ secret: "your-secret-key" }));
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});

// Create a 'to_do' table in your keyspace if it doesn't exist
const createTodosTableQuery = `
  CREATE TABLE IF NOT EXISTS to_do.to_do (
    id UUID PRIMARY KEY,
    description TEXT,
    
  )`;

client
  .execute(createTodosTableQuery)
  .then(() => console.log('Created the "to_do" table'))
  .catch((err) => console.error("Error creating table:", err));

// Create a new TODO item
app.post("/to_do", async (req, res) => {
  try {
    const { description } = req.body;
    const query = "INSERT INTO to_do.to_do (id, description) VALUES (?, ?)";
    const todoId = uuidv4(); // Generate a timestamp-based "UUID"
    await client.execute(query, [types.Uuid.fromString(todoId), description]);
    res.status(201).send("TODO item created");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating TODO item");
  }
});

// Get all TODO items
app.get("/to_do", async (req, res) => {
  try {
    const query = "SELECT * FROM to_do.to_do";
    const result = await client.execute(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching TODO items");
  }
});

// Update a TODO item
app.put("/to_do/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const { description } = req.body;
    console.log(description);
    const query = "UPDATE to_do.to_do SET description = ? WHERE id = ?";
    await client.execute(query, [id, description]);
    res.send("TODO item updated");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating TODO item");
  }
});

// Delete a TODO item
app.delete("/to_do/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = "DELETE FROM to_do.to_do WHERE id = ?";
    await client.execute(query, [id]);
    res.send("TODO item deleted");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting TODO item");
  }
});

const fs = require("fs");
const path = require("path");
const { getNotas } = require("./notaController");
const dataPath = path.join("database-json", "order.json");

// Helper functions
const getOrders = () => {
  const data = fs.readFileSync(dataPath);
  return JSON.parse(data);
};

// Save data
const saveOrders = (orders) => {
  fs.writeFileSync(dataPath, JSON.stringify(orders, null, 2));
};

module.exports = { getOrders, saveOrders };

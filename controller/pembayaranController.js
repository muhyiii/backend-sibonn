const fs = require("fs");
const path = require("path");
const { getNotas } = require("./notaController");
const dataPath = path.join("database-json", "pembayaran.json");

// Helper functions
const getPembayarans = () => {
  const data = fs.readFileSync(dataPath);
  return JSON.parse(data);
};
// Save data
const savePembayaran = (notas) => {
  fs.writeFileSync(dataPath, JSON.stringify(notas, null, 2));
};

module.exports = { getPembayarans ,savePembayaran};

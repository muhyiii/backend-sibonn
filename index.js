const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const port = 1234;
const cors = require("cors");
const {
  getUsers,
  addUser,
  updateUser,
  getUserById,
  getUsersAll,
} = require("./controller/userController");
const {
  getNotasAll,
  getNotaById,
  addNota,
  updateNota,
  updatePembayaran,
  deleteNotaAndData,
} = require("./controller/notaController");
app.use(express.json());
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    msg:'Berhasil masuk ke API Sibonn'
  });
});

app.get("/reset-data-backend", (req, res) => {
  const userPath = path.join("database-json", "users.json");
  const orderPath = path.join("database-json", "order.json");
  const pembayaranPath = path.join("database-json", "pembayaran.json");
  const notaPath = path.join("database-json", "nota.json");

  // Check if file exists and delete if it does
  if (
    fs.existsSync(userPath) ||
    fs.existsSync(orderPath) ||
    fs.existsSync(pembayaranPath) ||
    fs.existsSync(notaPath)
  ) {
    fs.existsSync(userPath);
    fs.existsSync(orderPath);
    fs.existsSync(pembayaranPath);
    fs.existsSync(notaPath);
  }

  // Create a new empty JSON file
  fs.writeFileSync(userPath, JSON.stringify([]), "utf8");
  fs.writeFileSync(orderPath, JSON.stringify([]), "utf8");
  fs.writeFileSync(pembayaranPath, JSON.stringify([]), "utf8");
  fs.writeFileSync(notaPath, JSON.stringify([]), "utf8");
  res.send("Backend reset");
});

// USER / KLIEN
// Read - Dapatkan semua user
app.get("/users", getUsersAll);
// Create - Tambah user
app.post("/users/tambah", addUser);
// Read - Dapatkan user berdasarkan nama
app.get("/users/:id", getUserById);
// Update - Perbarui user
app.put("/users/update/:id", updateUser);

// NOTA
// Read - Dapatkan semua nota
app.get("/notas", getNotasAll);
// Read - Dapatkan nota berdasarkan nomor nota
app.get("/notas/:nota_no", getNotaById);
// Create - Tambah nota, order dan pembayaran jika ada
app.post("/notas/tambah", addNota);
// Update - Perbarui pekerjaan dan Order
app.put("/notas/update/:nota_no", updateNota);
// Update - Perbarui pembayaran
app.put("/notas/update-pembayaran/:nota_no", updatePembayaran);
// Delete - Hapus data nota, order dan pembayaran
app.delete("/notas/delete-data/:nota_no", deleteNotaAndData);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const uri = process.env.DB_HOST;
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
  deleteOrder,
} = require("./controller/notaController");
const { User, Order, Pembayaran, Nota } = require("./model/model");
app.use(express.json());
app.use(cors());
app.use(express.json());

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

app.get("/", (req, res) => {
  res.json({
    msg: "Berhasil masuk ke API Sibonn",
  });
});

app.get("/reset-data-backend", async (req, res) => {
  await User.deleteMany({});
  await Order.deleteMany({});
  await Pembayaran.deleteMany({});
  await Nota.deleteMany({});

  res.statusCode(200).json({
    status: "Success",
    message: "Databases reset",
  });
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
app.get("/notas/:id", getNotaById);
// Create - Tambah nota, order dan pembayaran jika ada
app.post("/notas/tambah", addNota);
// Update - Perbarui pekerjaan dan Order
app.put("/notas/update/:id", updateNota);
// Update - Perbarui pembayaran
app.put("/notas/update-pembayaran/:id", updatePembayaran);
// Delete - Hapus data nota, order dan pembayaran
// app.delete("/notas/delete-order/:id", deleteOrder)

app.delete("/notas/delete-data/:id", deleteNotaAndData);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

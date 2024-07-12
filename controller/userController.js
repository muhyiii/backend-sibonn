const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { getNotas } = require("./notaController");
const dataPath = path.join("database-json", "users.json");

// Helper functions
const getUsers = () => {
  try {
    const data = fs.readFileSync(dataPath, "utf8"); // Read file synchronously
    return JSON.parse(data); // Parse JSON data into JavaScript object
  } catch (err) {
    console.error("Error reading user data:", err);
    return []; // Return empty array if there's an error
  }
};

// Save data
const saveUsers = (users) => {
  fs.writeFileSync(dataPath, JSON.stringify(users, null, 2));
};

// Validasi
const validateUser = (user) => {
  const { nama, noTelp } = user;
  const nameRegex = /^[A-Za-z\s]+$/;
  const phoneRegex = /^[0-9]+$/;

  if (!nama || !nameRegex.test(nama)) {
    return "Nama invalid. Hanya huruf dan spasi yang diperbolehkan.";
  }

  if (!noTelp || !phoneRegex.test(noTelp)) {
    return "Nomor Telpon invalid. Hanya angka yang diperbolehkan";
  }

  return null;
};

// Get Semua Data User
const getUsersAll = async (req, res) => {
  const users = getUsers();
  const notas = await getNotas();
  if (users.length < 1) {
    return res.json({ msg: "Data Klien kosong", data: users });
  }

  // Mapping user data with their corresponding notas
  const usersWithNotas = users.map((user) => {
    return {
      ...user,
      notas: notas.filter((nota) => nota.klien_id === user.id).length,
    };
  });
  res.json({
    msg: "Berhasil Mendapatkan Data Klien",
    data: usersWithNotas,
  });
};

// Tambah User Baru
const addUser = async (req, res) => {
  const users = getUsers();
  const newUser = req.body;
  newUser.id = uuidv4();
  const validationError = validateUser(newUser);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }
  users.push(newUser);
  saveUsers(users);
  res
    .status(201)
    .json({ msg: "Berhasil Menambah Data Klien Baru", data: newUser });
};

// Get User Berdasarkan Id dan Notanya
const getUserWithNotas = async (userId) => {
  try {
    const users = await getUsers(); // Mendapatkan data pengguna secara asynchronous
    const notas = getNotas(); // Fungsi ini harus mengembalikan array objek nota dari suatu sumber

    const user = users.find((user) => user.id === userId);
    if (user) {
      user.notas = notas.filter((nota) => nota.klien_id === user.id); // Menambahkan parameter nota ke user
      return user;
    } else {
      throw new Error("User tidak ditemukan");
    }
  } catch (err) {
    console.error("Error:", err);
    throw new Error("Gagal memuat data");
  }
};

// Get User Fungsi Utama
const getUserById = async (req, res) => {
  try {
    const userId = req.params.id; // Mendapatkan ID dari parameter request
    const userWithNotas = await getUserWithNotas(userId);
    res.json({
      msg: "Berhasil Mendapatkan Data User dengan Nota",
      data: userWithNotas,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Gagal memuat data" });
  }
};

// Update User Berdasarkan Id
const updateUser = async (req, res) => {
  const users = getUsers();
  const id = req.params.id;
  const userIndex = users.findIndex((u) => u.id === id);

  if (userIndex !== -1) {
    const updatedUser = {
      ...users[userIndex],
      nama: req.body.nama || users[userIndex].nama,
      noTelp: req.body.noTelp || users[userIndex].noTelp,
    };
    users[userIndex] = updatedUser;
    saveUsers(users);
    res.json({ msg: `Berhasil Mengupdate Data Klien` });
  } else {
    return res
      .status(404)
      .json({ error: `Klien Dengan Id ${id} Tidak Ditemukan` });
  }
};

module.exports = { getUsers, getUsersAll, getUserById, addUser, updateUser };

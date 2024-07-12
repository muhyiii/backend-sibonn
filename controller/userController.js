const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { getNotas } = require("./notaController");
const { User } = require("../model/model");
const { default: mongoose } = require("mongoose");
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
  try {
    const data = await User.find();
    return res.status(200).json({
      status: "Success",
      data: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Failed",
      message: "Something went wrong",
      error: error,
    });
  }
};

// Tambah User Baru
const addUser = async (req, res) => {
  try {
    const body = req.body;
    const result = await User.create(body);
    return res.status(200).json({
      status: "Success",
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Failed",
      message: "Something went wrong",
      error: error,
    });
  }
};

// Get User Berdasarkan Id dan Notanya
const getUserWithNotas = async (req, res) => {
  try {
    // const users = await getUsers(); // Mendapatkan data pengguna secara asynchronous
    // const notas = getNotas(); // Fungsi ini harus mengembalikan array objek nota dari suatu sumber

    // const user = users.find((user) => user.id === userId);
    // if (user) {
    //   user.notas = notas.filter((nota) => nota.klien_id === user.id); // Menambahkan parameter nota ke user
    //   return user;
    // } else {
    //   throw new Error("User tidak ditemukan");
    // }
    const ObjectId = mongoose.Types.ObjectId;

    const { id } = req.params;
    const user = await User.aggregate([
      {
        $match: {
          _id: new ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "notas",
          localField: "_id",
          foreignField: "user_id",
          as: "nota",
        },
      },
    ]);

    return res.status(200).json({
      status: "Success",
      data: user,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      status: "Failed",
      message: "Something went wrong",
      error: err,
    });
  }
};

// Get User Fungsi Utama
const getUserById = async (req, res) => {
  try {
    const ObjectId = mongoose.Types.ObjectId;

    const userId = req.params.id; // Mendapatkan ID dari parameter request
    const user = await User.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({
        status: "Failed",
        message: "User's not found",
      });
    }
    return res.status(200).json({
      status: "Success",
      data: user,
    });
  } catch (err) {
    console.error("Error:", err);
    return res
      .status(500)
      .json({ status: "Failed", message: "Something went wrong", error: err });
  }
};

// Update User Berdasarkan Id
const updateUser = async (req, res) => {
  try {
    const ObjectId = mongoose.Types.ObjectId;

    const { id } = req.params;
    const { nama, noTelp } = req.body;
    const user = await User.findOne({ _id: ObjectId(id) });
    if (!user) {
      return res.status(404).json({
        status: "Failed",
        message: "User's not found",
      });
    }
    await User.updateOne(
      { _id: ObjectId(id) },
      {
        $set: {
          nama: nama,
          noTelp: noTelp,
        },
      }
    );

    return res.status(200).json({
      status: "Success",
      message: "User's updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Failed",
      message: "Something went wrong",
      error: error,
    });
  }
};
module.exports = { getUsers, getUsersAll, getUserById, addUser, updateUser };

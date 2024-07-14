const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { getOrders, saveOrders } = require("./orderController");
const { getPembayarans, savePembayaran } = require("./pembayaranController");
const { log, error } = require("console");
const { Nota } = require("../model/model");

const dataPath = path.join("database-json", "nota.json");
const dataPathUser = path.join("database-json", "users.json");

// Helper functions
const getNotas = () => {
  const data = fs.readFileSync(dataPath);
  return JSON.parse(data);
};

const getUsers = () => {
  try {
    const data = fs.readFileSync(dataPathUser, "utf8"); // Read file synchronously
    return JSON.parse(data); // Parse JSON data into JavaScript object
  } catch (err) {
    console.error("Error reading user data:", err);
    return []; // Return empty array if there's an error
  }
};

// Save data
const saveNotas = (notas) => {
  fs.writeFileSync(dataPath, JSON.stringify(notas, null, 2));
};

// Tambah Nota Baru
const addNota = async (req, res) => {
  try {
    const dataNota = getNotas();
    const ordersData = await getOrders();
    const pembayaranData = await getPembayarans();
    const { orders, pembayaran, ...newNota } = req.body;
    // console.log(newNota);

    if (newNota.nota_no && newNota.klien_id && newNota.pekerjaan) {
      while (dataNota.find((data) => data.nota_no === newNota.nota_no)) {
        let no_nota = parseInt(newNota.nota_no);
        no_nota++;
        newNota.nota_no = `${no_nota}`;
      }
      newNota.status = "belum_lunas";
      newNota.terakhir_edit = "";
      dataNota.push(newNota);
      console.log(newNota);
      saveNotas(dataNota);
    }

    if (orders.length > 0) {
      orders.forEach((order) => {
        if (order.deskripsi && order.jumlah && order.harga) {
          order.order_id = uuidv4();
          order.nota_no = newNota.nota_no;
          order.total = parseInt(order.jumlah) * parseInt(order.harga);
          ordersData.push(order);
          saveOrders(ordersData);
        }
      });
    }
    if (pembayaran !== null) {
      if (pembayaran?.jumlah_bayar && pembayaran.tipe_pembayaran) {
        pembayaran.pembayaran_id = uuidv4();
        pembayaran.nota_no = newNota.nota_no;
        pembayaran.tanggal_bayar = new Date();
        pembayaran.sisa =
          parseInt(newNota.total) - parseInt(pembayaran.jumlah_bayar);
        pembayaranData.push(bayar);
        savePembayaran(pembayaranData);
      }
    }

    const newDataNota = dataNota.find(
      (data) => data.nota_no == newNota.nota_no
    );
    console.log("[[[[[[[[[[[[[[[[[");

    console.log(newDataNota);
    if (newDataNota)
      return res
        .status(201)
        .json({ msg: "Berhasil Menambah Data Nota Baru", data: newDataNota });
    else {
      res.status(500).json({ error: "Gagal memuat data" });
      console.log("kesalahan");
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({
      msg: error,
    });
  }
};

// Get Semua Data Nota
const getNotasAll = async (req, res) => {
  try {
    const dataNota = await Nota.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
    ]);
    return res.status(200).json({
      status: "Success",
      data: dataNota,
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

// Get Nota Detail Berdasarkan Id
const getNotaById = async (req, res) => {
  try {
    const { nota_no } = req.params;
    const users = getUsers();
    const notas = getNotas();
    if (notas.length < 1) {
      return res.json({ msg: "Data Klien kosong", data: notas });
    }
    const orders = await getOrders();
    const pembayarans = await getPembayarans();

    const newNota = notas.find((nota) => nota.nota_no === nota_no);
    if (newNota) {
      const user = users.find((user) => user.id === newNota.klien_id);
      newNota.user = user;
      delete newNota.klien_id;
    }

    const filterOrders = orders.filter(
      (order) => order.nota_no === newNota?.nota_no
    );
    const filterPembayarans = pembayarans.filter(
      (cicilan) => cicilan.nota_no === newNota.nota_no
    );
    if (filterOrders.length > 0) {
      newNota.orders = filterOrders;
    } else {
      newNota.orders = [];
    }

    if (filterPembayarans.length > 0) {
      newNota.pembayarans = filterPembayarans;
    } else {
      newNota.pembayarans = [];
    }

    res.json({
      msg: "Berhasil Mendapatkan Data Nota",
      data: newNota,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Gagal memuat data" });
  }
};

// PUT UNTUK UPDATE TOTAL DAN ISI ORDER NOTA
const updateNota = async (req, res) => {
  const notas = getNotas();
  const dataOrders = await getOrders();
  const dataPembayaran = await getPembayarans(); // Ambil data pembayaran

  const nota_no = req.params.nota_no;
  const notaDataIndex = notas.findIndex((data) => data.nota_no === nota_no);

  if (notaDataIndex !== -1) {
    let updatedNota = {
      ...notas[notaDataIndex],
      pekerjaan: req.body.pekerjaan || notas[notaDataIndex].pekerjaan,
      total: req.body.total || notas[notaDataIndex].total,
      terakhir_edit: new Date(),
    };

    // Cari semua orders yang terkait dengan nota_no
    const ordersToDelete = dataOrders.filter(
      (order) => order.nota_no === nota_no
    );

    // Hapus semua orders yang terkait dengan nota_no
    if (ordersToDelete.length > 0) {
      ordersToDelete.forEach((order) => {
        const orderIndex = dataOrders.findIndex(
          (o) => o.order_id === order.order_id
        );
        if (orderIndex !== -1) {
          dataOrders.splice(orderIndex, 1);
        }
      });
    }

    // Tambahkan data order baru
    if (req.body.orders && req.body.orders.length > 0) {
      req.body.orders.forEach((newOrder) => {
        newOrder.order_id = uuidv4(); // Buat ID baru untuk order
        newOrder.nota_no = nota_no; // Kaitkan order dengan nota_no
        newOrder.total = parseInt(newOrder.jumlah) * parseInt(newOrder.harga);
        dataOrders.push(newOrder);
      });
      saveOrders(dataOrders);
    }

    // Proses pembayaran terkait
    const filterPembayaran = dataPembayaran.filter(
      (bayar) => bayar.nota_no == nota_no
    );

    if (filterPembayaran.length > 0) {
      if (notas[notaDataIndex].total !== req.body.total) {
        filterPembayaran.sort(
          (a, b) =>
            new Date(a.tanggal_pembayaran) - new Date(b.tanggal_pembayaran)
        );

        let sisa = req.body.total;

        filterPembayaran.forEach((bayar, index) => {
          if (index === 0) {
            bayar.sisa =
              parseInt(sisa) - parseInt(bayar.jumlah_bayar) || bayar.sisa;
          } else {
            bayar.sisa =
              parseInt(filterPembayaran[index - 1].sisa) -
                parseInt(bayar.jumlah_bayar) || bayar.sisa;
          }
          if (filterPembayaran[index - 1].sisa === 0) {
            updateNota.status = "lunas";
          } else {
            updateNota.status = "belum_lunas";
          }
          sisa = bayar.sisa;
        });

        savePembayaran(dataPembayaran);
      }
    }

    notas[notaDataIndex] = updatedNota;
    saveNotas(notas);
    res.json({
      msg: `Berhasil Mengupdate Data Nota`,
      data: updatedNota,
      no: req.body.total,
    });
  } else {
    return res
      .status(404)
      .json({ error: `Nota dengan No ${nota_no} Tidak Ditemukan` });
  }
};

// UPDATE NOTA PEMBAYARAN
const updatePembayaran = async (req, res) => {
  const notas = getNotas();
  const dataPembayaran = await getPembayarans();
  const { bayar } = req.body;
  const { nota_no } = req.params;
  const notaDataIndex = notas.findIndex((data) => data.nota_no === nota_no);

  if (bayar !== null) {
    if (bayar?.jumlah_bayar && bayar.tipe_pembayaran) {
      let pembayaran = {};
      pembayaran.pembayaran_id = uuidv4();
      pembayaran.nota_no = nota_no;
      pembayaran.tanggal_bayar = new Date();

      // Find the last payment for the same nota_no
      const previousPembayaran = dataPembayaran
        .filter((p) => p.nota_no === nota_no)
        .sort(
          (a, b) => new Date(b.tanggal_bayar) - new Date(a.tanggal_bayar)
        )[0];

      if (previousPembayaran) {
        // Calculate the new 'sisa' based on the previous payment
        // console.log(previousPembayaran);
        if (parseInt(bayar.jumlah_bayar) > previousPembayaran.sisa) {
          pembayaran.jumlah_bayar = previousPembayaran.sisa;
          pembayaran.sisa = 0;
        } else {
          pembayaran.jumlah_bayar = bayar.jumlah_bayar;
          pembayaran.sisa =
            parseInt(previousPembayaran.sisa) - parseInt(bayar.jumlah_bayar);
        }
      } else {
        // If there's no previous payment, use the total from the nota
        const nota = notas.find((n) => n.nota_no === nota_no);
        pembayaran.sisa = parseInt(nota.total) - parseInt(bayar.jumlah_bayar);
      }
      if (pembayaran.sisa === 0) {
        let updatedNota = {
          ...notas[notaDataIndex],
          status: "lunas",
          terakhir_edit: new Date(),
        };
        notas[notaDataIndex] = updatedNota;
        saveNotas(notas);
      }

      pembayaran.tipe_pembayaran = bayar.tipe_pembayaran;
      dataPembayaran.push(pembayaran);
      savePembayaran(dataPembayaran);

      res.status(200).send({ msg: "Pembayaran berhasil diupdate", pembayaran });
    } else {
      res.status(400).send({ msg: "Data pembayaran tidak valid" });
    }
  } else {
    res.status(400).send({ msg: "Data pembayaran tidak ada" });
  }
};

const deleteNotaAndData = async (req, res) => {
  const dataNota = getNotas();
  const dataOrder = await getOrders();
  const dataPembayaran = await getPembayarans(); // Ambil data pembayaran
  const nota_no = req.params.nota_no;

  const filterNota = dataNota.filter((data) => data.nota_no !== nota_no);
  const filterOrder = dataOrder.filter((data) => data.nota_no !== nota_no);
  const filterPembayaran = dataPembayaran.filter(
    (data) => data.nota_no !== nota_no
  );

  saveNotas(filterNota);
  saveOrders(filterOrder);
  savePembayaran(filterPembayaran);

  const checkFilterNota = dataNota.filter((data) => data.nota_no === nota_no);
  console.log(checkFilterNota.length);
  if (checkFilterNota) {
    res.json({
      msg: "Berhasil menghapus data",
    });
  } else {
    res.status(400).send({ msg: "Gagal menghapus data" });
  }
};

module.exports = {
  getNotas,
  getNotasAll,
  getNotaById,
  addNota,
  updateNota,
  updatePembayaran,
  deleteNotaAndData,
};

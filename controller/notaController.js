const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { getOrders, saveOrders } = require("./orderController");
const { getPembayarans, savePembayaran } = require("./pembayaranController");
const { log, error } = require("console");
const { Nota, User, Order, Pembayaran } = require("../model/model");
const { default: mongoose } = require("mongoose");

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
    // const dataNota = getNotas();
    // const ordersData = await getOrders();
    // const pembayaranData = await getPembayarans();
    // const { orders, pembayaran, ...newNota } = req.body;
    // console.log(orders);
    // // console.log(newNota);

    // if (newNota.nota_no && newNota.klien_id && newNota.pekerjaan) {
    //   while (dataNota.find((data) => data.nota_no === newNota.nota_no)) {
    //     let no_nota = parseInt(newNota.nota_no);
    //     no_nota++;
    //     newNota.nota_no = `${no_nota}`;
    //   }
    //   newNota.status = "belum_lunas";
    //   newNota.terakhir_edit = "";
    //   dataNota.push(newNota);
    //   console.log(newNota);
    //   saveNotas(dataNota);
    // }

    // if (orders.length > 0) {
    //   orders.forEach((order) => {
    //     if (order.deskripsi && order.jumlah && order.harga) {
    //       order.order_id = uuidv4();
    //       order.nota_no = newNota.nota_no;
    //       order.total = parseInt(order.jumlah) * parseInt(order.harga);
    //       ordersData.push(order);
    //       saveOrders(ordersData);
    //     }
    //   });
    // }
    // if (pembayaran !== null) {
    //   if (pembayaran?.jumlah_bayar && pembayaran.tipe_pembayaran) {
    //     pembayaran.pembayaran_id = uuidv4();
    //     pembayaran.nota_no = newNota.nota_no;
    //     pembayaran.tanggal_bayar = new Date();
    //     pembayaran.sisa =
    //       parseInt(newNota.total) - parseInt(pembayaran.jumlah_bayar);
    //     pembayaranData.push(bayar);
    //     savePembayaran(pembayaranData);
    //   }
    // }

    // const newDataNota = dataNota.find(
    //   (data) => data.nota_no == newNota.nota_no
    // );
    // console.log("[[[[[[[[[[[[[[[[[");

    // console.log(newDataNota);
    // if (newDataNota)
    //   return res
    //     .status(201)
    //     .json({ msg: "Berhasil Menambah Data Nota Baru", data: newDataNota });
    // else {
    //   res.status(500).json({ error: "Gagal memuat data" });
    //   console.log("kesalahan");
    // }
    const ObjectId = mongoose.Types.ObjectId;

    const { nota, orders, pembayaran } = req.body;
    // console.log(nota, orders, pembayaran);
    // console.log(body);
    const check_user = await User.findOne({ _id: new ObjectId(nota.user_id) });
    // console.log(check_user);
    if (!check_user) {
      return res.status(404).json({
        status: "Failed",
        message: "User's not found",
      });
    }
    const newNota = await Nota.create({
      user_id: nota.user_id,
      pekerjaan: nota.pekerjaan,
      tanggal_order: nota.tanggal_order,
      total: nota.total,
      
    });

    if (orders.length != 0) {
      // console.log("HAI");
      const newOrder = orders.map((order) => ({
        ...order,
        nota_id: newNota._id,
        total: order.jumlah * order.harga,
      }));
      // console.log(newOrder);
      const result = await Order.insertMany(newOrder);
      const notaTotal = newOrder.reduce((sum, order) => sum + order.total, 0);
      console.log(notaTotal);
      const updatedNota = await Nota.findOneAndUpdate(
        { nota_id: newOrder.nota_id },
        { total: notaTotal }
      );
      // return console.log(updatedNota.total);
      console.log(pembayaran.length);
      if (pembayaran && Object.keys(pembayaran).length > 0) {
        await Pembayaran.create({
          nota_id: newNota._id,
          tanggal_bayar: new Date(),
          jumlah_bayar: pembayaran.jumlah_bayar,
          sisa: updatedNota.total - parseInt(pembayaran.jumlah_bayar),
        });
      }
    }

    const data = await Nota.aggregate([
      {
        $match: {
          _id: new ObjectId(newNota._id),
        },
      },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "nota_id",
          as: "order",
        },
      },
      {
        $lookup: {
          from: "pembayarans",
          localField: "_id",
          foreignField: "nota_id",
          as: "pembayaran",
        },
      },
    ]);
    return res.status(200).json({
      status: "Success",
      data: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "Failed",
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
    const ObjectId = mongoose.Types.ObjectId;
    const { id } = req.params;
    const dataNota = await Nota.aggregate([
      {
        $match: {
          _id: new ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "nota_id",
          as: "order",
        },
      },
      {
        $lookup: {
          from: "pembayarans",
          localField: "_id",
          foreignField: "nota_id",
          as: "pembayaran",
        },
      },
    ]);
    console.log(dataNota.length == 0);
    if (dataNota.length == 0) {
      return res.status(404).json({
        status: "Failed",
        message: "Data Nota Tidak Ditemukan",
      });
    }
    return res.status(200).json({
      status: "Success",
      data: dataNota,
    });
  } catch (err) {
    console.error("Error:", err);
    return res
      .status(500)
      .json({ status: "Failed", message: "Gagal memuat data", error: err });
  }
};

// PUT UNTUK UPDATE TOTAL DAN ISI ORDER NOTA
const updateNota = async (req, res) => {
  // const notas = getNotas();
  // const dataOrders = await getOrders();
  // const dataPembayaran = await getPembayarans(); // Ambil data pembayaran

  // const nota_no = req.params.nota_no;
  // const notaDataIndex = notas.findIndex((data) => data.nota_no === nota_no);

  // if (notaDataIndex !== -1) {
  //   let updatedNota = {
  //     ...notas[notaDataIndex],
  //     pekerjaan: req.body.pekerjaan || notas[notaDataIndex].pekerjaan,
  //     total: req.body.total || notas[notaDataIndex].total,
  //     terakhir_edit: new Date(),
  //   };

  //   // Cari semua orders yang terkait dengan nota_no
  //   const ordersToDelete = dataOrders.filter(
  //     (order) => order.nota_no === nota_no
  //   );

  //   // Hapus semua orders yang terkait dengan nota_no
  //   if (ordersToDelete.length > 0) {
  //     ordersToDelete.forEach((order) => {
  //       const orderIndex = dataOrders.findIndex(
  //         (o) => o.order_id === order.order_id
  //       );
  //       if (orderIndex !== -1) {
  //         dataOrders.splice(orderIndex, 1);
  //       }
  //     });
  //   }

  //   // Tambahkan data order baru
  //   if (req.body.orders && req.body.orders.length > 0) {
  //     req.body.orders.forEach((newOrder) => {
  //       newOrder.order_id = uuidv4(); // Buat ID baru untuk order
  //       newOrder.nota_no = nota_no; // Kaitkan order dengan nota_no
  //       newOrder.total = parseInt(newOrder.jumlah) * parseInt(newOrder.harga);
  //       dataOrders.push(newOrder);
  //     });
  //     saveOrders(dataOrders);
  //   }

  //   // Proses pembayaran terkait
  //   const filterPembayaran = dataPembayaran.filter(
  //     (bayar) => bayar.nota_no == nota_no
  //   );

  //   if (filterPembayaran.length > 0) {
  //     if (notas[notaDataIndex].total !== req.body.total) {
  //       filterPembayaran.sort(
  //         (a, b) =>
  //           new Date(a.tanggal_pembayaran) - new Date(b.tanggal_pembayaran)
  //       );

  //       let sisa = req.body.total;

  //       filterPembayaran.forEach((bayar, index) => {
  //         if (index === 0) {
  //           bayar.sisa =
  //             parseInt(sisa) - parseInt(bayar.jumlah_bayar) || bayar.sisa;
  //         } else {
  //           bayar.sisa =
  //             parseInt(filterPembayaran[index - 1].sisa) -
  //               parseInt(bayar.jumlah_bayar) || bayar.sisa;
  //         }
  //         if (filterPembayaran[index - 1].sisa === 0) {
  //           updateNota.status = "lunas";
  //         } else {
  //           updateNota.status = "belum_lunas";
  //         }
  //         sisa = bayar.sisa;
  //       });

  //       savePembayaran(dataPembayaran);
  //     }
  //   }

  //   notas[notaDataIndex] = updatedNota;
  //   saveNotas(notas);
  //   res.json({
  //     msg: `Berhasil Mengupdate Data Nota`,
  //     data: updatedNota,
  //     no: req.body.total,
  //   });
  // } else {
  //   return res
  //     .status(404)
  //     .json({ error: `Nota dengan No ${nota_no} Tidak Ditemukan` });
  // }
  try {
    const ObjectId = mongoose.Types.ObjectId;
    const { id } = req.params;
    const { pekerjaan, orders } = req.body;
    const notas = await Nota.findOne({ _id: new ObjectId(id) });

    if (!notas) {
      return res.status(404).json({
        status: "Failed",
        message: "Nota tidak ditemukan",
      });
    }
    const newNota = await Nota.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          pekerjaan: pekerjaan,
        },
      }
    );
    if (orders && orders.length > 0) {
      // Process each order
      for (const order of orders) {
        const { _id, jumlah, deskripsi, harga } = order;

        // Check if the order is new (no _id) or existing (has _id)
        if (!_id) {
          // Insert new order
          const newOrder = new Order({
            jumlah,
            deskripsi,
            harga,
            nota_id: id,
            total: jumlah * harga,
          });
          await newOrder.save();
        } else {
          // Update existing order
          await Order.findOneAndUpdate(
            { _id: new ObjectId(_id) },
            {
              jumlah: jumlah,
              harga: harga,
              deskripsi: deskripsi,
              total: jumlah * harga,
            }
          );
        }
      }

      // Fetch updated orders and calculate total
      const updatedOrders = await Order.find({ nota_id: id });
      const notaTotal = updatedOrders.reduce(
        (sum, order) => sum + order.jumlah * order.harga,
        0
      );

      // Update the Nota document with the new total
      await Nota.updateOne(
        { _id: new ObjectId(id) },
        { $set: { total: notaTotal } }
      );

      console.log(`Total Nota: ${notaTotal}`);
    } else {
      console.log("No orders to process");
    }

    const dataNota = await Nota.aggregate([
      {
        $match: {
          _id: new ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "nota_id",
          as: "orders",
        },
      },
    ]);
    return res.status(200).json({
      status: "Success",
      message: "Nota telah di update",
      data: dataNota,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Failed",
      message: "Internal Server Error",
    });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const ObjectId = mongoose.Types.ObjectId;

    const { id } = req.params;
    const data = await Order.findOne({ _id: new ObjectId(id) });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Failed",
      message: "Internal Server Error",
    });
  }
};

// UPDATE NOTA PEMBAYARAN
const updatePembayaran = async (req, res) => {
  // const notas = getNotas();
  // const dataPembayaran = await getPembayarans();
  // const { bayar } = req.body;
  // const { nota_no } = req.params;
  // const notaDataIndex = notas.findIndex((data) => data.nota_no === nota_no);

  // if (bayar !== null) {
  //   if (bayar?.jumlah_bayar && bayar.tipe_pembayaran) {
  //     let pembayaran = {};
  //     pembayaran.pembayaran_id = uuidv4();
  //     pembayaran.nota_no = nota_no;
  //     pembayaran.tanggal_bayar = new Date();

  //     // Find the last payment for the same nota_no
  //     const previousPembayaran = dataPembayaran
  //       .filter((p) => p.nota_no === nota_no)
  //       .sort(
  //         (a, b) => new Date(b.tanggal_bayar) - new Date(a.tanggal_bayar)
  //       )[0];

  //     if (previousPembayaran) {
  //       // Calculate the new 'sisa' based on the previous payment
  //       // console.log(previousPembayaran);
  //       if (parseInt(bayar.jumlah_bayar) > previousPembayaran.sisa) {
  //         pembayaran.jumlah_bayar = previousPembayaran.sisa;
  //         pembayaran.sisa = 0;
  //       } else {
  //         pembayaran.jumlah_bayar = bayar.jumlah_bayar;
  //         pembayaran.sisa =
  //           parseInt(previousPembayaran.sisa) - parseInt(bayar.jumlah_bayar);
  //       }
  //     } else {
  //       // If there's no previous payment, use the total from the nota
  //       const nota = notas.find((n) => n.nota_no === nota_no);
  //       pembayaran.sisa = parseInt(nota.total) - parseInt(bayar.jumlah_bayar);
  //     }
  //     if (pembayaran.sisa === 0) {
  //       let updatedNota = {
  //         ...notas[notaDataIndex],
  //         status: "lunas",
  //         terakhir_edit: new Date(),
  //       };
  //       notas[notaDataIndex] = updatedNota;
  //       saveNotas(notas);
  //     }

  //     pembayaran.tipe_pembayaran = bayar.tipe_pembayaran;
  //     dataPembayaran.push(pembayaran);
  //     savePembayaran(dataPembayaran);

  //     res.status(200).send({ msg: "Pembayaran berhasil diupdate", pembayaran });
  //   } else {
  //     res.status(400).send({ msg: "Data pembayaran tidak valid" });
  //   }
  // } else {
  //   res.status(400).send({ msg: "Data pembayaran tidak ada" });
  // }
  try {
    const ObjectId = mongoose.Types.ObjectId;
    const { id } = req.params;
    const body = req.body;
    let lebih_sisa = false;
    const pembayarans = await Pembayaran.findOne({ _id: new ObjectId(id) });
    if (!pembayarans) {
      return res.status(404).json({
        status: "Failed",
        message: "Pembayaran tidak ditemukan",
      });
    }
    const notas = await Nota.findOne({
      _id: new ObjectId(pembayarans.nota_id),
    });
    const previous = await Pembayaran.findOne({ _id: new ObjectId(id) }).sort({
      tanggal_bayar: -1,
    });
    if (previous.length != 0) {
      console.log(previous);
      if (body.jumlah_bayar > previous.sisa) {
        body.jumlah_bayar = previous.sisa;
        body.sisa = 0;
        lebih_sisa = true;
      } else {
        body.sisa = parseInt(previous.sisa) - parseInt(body.jumlah_bayar);
      }
      // if ()
    } else {
      body.sisa = parseInt(notas.total) - parseInt(body.jumlah_bayar);
    }

    if (body.sisa == 0) {
      await Nota.findOneAndUpdate(
        { _id: pembayarans.nota_id },
        {
          status: 1,
        }
      );
    }
    const result = await Pembayaran.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        ...body,
      }
    );
    console.log(body);
    return res.status(200).json({
      status: "Success",
      message: `Pembayaran ter update ${
        lebih_sisa ? "(Anda memasukkan lebih dari sisa)" : ""
      }`,
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Failed",
      message: "Internal Server Error",
      error: error,
    });
  }
};

const deleteNotaAndData = async (req, res) => {
  // const dataNota = getNotas();
  // const dataOrder = await getOrders();
  // const dataPembayaran = await getPembayarans(); // Ambil data pembayaran
  // const nota_no = req.params.nota_no;

  // const filterNota = dataNota.filter((data) => data.nota_no !== nota_no);
  // const filterOrder = dataOrder.filter((data) => data.nota_no !== nota_no);
  // const filterPembayaran = dataPembayaran.filter(
  //   (data) => data.nota_no !== nota_no
  // );

  // saveNotas(filterNota);
  // saveOrders(filterOrder);
  // savePembayaran(filterPembayaran);

  // const checkFilterNota = dataNota.filter((data) => data.nota_no === nota_no);
  // console.log(checkFilterNota.length);
  // if (checkFilterNota) {
  //   res.json({
  //     msg: "Berhasil menghapus data",
  //   });
  // } else {
  //   res.status(400).send({ msg: "Gagal menghapus data" });
  // }
  try {
    const { id } = req.params;
    const ObjectId = mongoose.Types.ObjectId;
    const notas = await Nota.findOne({ _id: new ObjectId(id) });
    if (!notas) {
      return res.status(404).json({
        status: "Failed",
        message: "Nota tidak ditemukan",
      });
    }
    const orders = await Order.find({ nota_id: new ObjectId(notas._id) });
    if (orders) {
      await Order.deleteMany({ nota_id: new ObjectId(notas._id) });
    }
    const pembayarans = await Pembayaran({ nota_id: new ObjectId(notas._id) });
    if (pembayarans) {
      await Pembayaran.deleteMany({ nota_id: new ObjectId(notas._id) });
    }
    await Nota.deleteOne({ _id: new ObjectId(notas._id) });
    return res.status(200).json({
      status: "Success",
      message: "Nota berhasil di hapus",
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

module.exports = {
  getNotas,
  getNotasAll,
  getNotaById,
  addNota,
  updateNota,
  updatePembayaran,
  deleteNotaAndData,
  deleteOrder,
};

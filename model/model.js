const { ObjectId } = require("bson");
const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  nama: {
    type: String,
    required: true,
  },
  noTelp: {
    type: String,
    required: true,
  },
});

const notaSchema = mongoose.Schema(
  {
    no_nota: {
      type: Number,
      unique: true
    },
    user_id: {
      type: ObjectId,
      required: true,
      ref: "users",
    },
    pekerjaan: {
      type: String,
      required: true,
    },
    tanggal_order: {
      type: Date,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: Number,
      max: 1,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const orderSchema = mongoose.Schema({
  jumlah: {
    type: Number,
    default: 0,
  },
  deskripsi: {
    type: String,
  },
  harga: {
    type: Number,
    required: true,
  },
  nota_id: {
    type: ObjectId,
    required: true,
    ref: "notas",
  },
  total: {
    type: Number,
    required: true,
  },
});

const pembayaranSchema = mongoose.Schema({
  nota_id: {
    type: ObjectId,
    required: true,
    ref: "notas",
  },
  jumlah_bayar: {
    type: Number,
    required: true,
  },
  tanggal_bayar: {
    type: Date,
  },
  sisa: {
    type: Number,
  },
  tipe_pembayaran: {
    type: Number,
    default: 0,
    max: 1,
  },
});


notaSchema.pre('save', async function (next) {
  try {
    if (!this.isNew) {
      return next();
    }

    // Find the highest no_nota value in existing documents
    const highestNota = await this.constructor.findOne({}, {}, { sort: { no_nota: -1 } });

    // Set the new no_nota value
    this.no_nota = highestNota ? highestNota.no_nota + 1 : 1;

    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model("users", userSchema);
const Nota = mongoose.model("notas", notaSchema);
const Order = mongoose.model("Orders", orderSchema);
const Pembayaran = mongoose.model("Pembayarans", pembayaranSchema);

module.exports = {
  User,
  Nota,
  Order,
  Pembayaran,
};

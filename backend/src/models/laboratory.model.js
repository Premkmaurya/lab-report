const mongoose = require('mongoose');

const laboratorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Laboratory name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Laboratory code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    letterheadAddressLine: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    gstNumber: {
      type: String,
      trim: true,
      default: '',
    },
    licenseNumber: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    settings: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

laboratorySchema.index({ status: 1 });

module.exports = mongoose.model('Laboratory', laboratorySchema);

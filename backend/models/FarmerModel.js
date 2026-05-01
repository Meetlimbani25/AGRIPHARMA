const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Farmer = sequelize.define('Farmer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  village: { type: DataTypes.STRING(120) },
  taluko: { type: DataTypes.STRING(120) },
  district: { type: DataTypes.STRING(120) },
  land_size: { type: DataTypes.STRING(50) },
  mobile: { type: DataTypes.STRING(20), unique: true },
  email: { type: DataTypes.STRING(150) },
  water_level: { type: DataTypes.STRING(50) },
  password: { type: DataTypes.STRING(255), allowNull: false },
  reset_otp: { type: DataTypes.STRING(10) },
  reset_otp_expiry: { type: DataTypes.DATE }
}, {
  tableName: 'farmers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

class FarmerModel {
  static async findByMobile(mobile) {
    const farmer = await Farmer.findOne({ where: { mobile }, raw: true });
    return farmer;
  }

  static async findById(id) {
    const farmer = await Farmer.findByPk(id, {
      attributes: ['id', 'name', 'village', 'taluko', 'district', 'land_size', 'mobile', 'email', 'water_level', 'created_at'],
      raw: true
    });
    return farmer;
  }

  static async create(farmerData) {
    const farmer = await Farmer.create(farmerData);
    return farmer.id;
  }

  static async update(id, updateData) {
    await Farmer.update(updateData, { where: { id } });
  }

  static async findByEmail(email) {
    const farmer = await Farmer.findOne({
      where: { email },
      attributes: ['id', 'reset_otp', 'reset_otp_expiry'],
      raw: true
    });
    return farmer;
  }

  static async findByEmailFull(email) {
    const farmer = await Farmer.findOne({ where: { email }, raw: true });
    return farmer;
  }

  static async updateOtp(email, otp, expiry) {
    await Farmer.update({ reset_otp: otp, reset_otp_expiry: expiry }, { where: { email } });
  }

  static async updatePasswordAndClearOtp(email, hashedPassword) {
    await Farmer.update({
      password: hashedPassword,
      reset_otp: null,
      reset_otp_expiry: null
    }, { where: { email } });
  }
}

module.exports = FarmerModel;

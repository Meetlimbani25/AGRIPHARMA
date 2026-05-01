const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Shopkeeper = sequelize.define('Shopkeeper', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  shop_name: { type: DataTypes.STRING(150), allowNull: false },
  mobile: { type: DataTypes.STRING(20), unique: true },
  email: { type: DataTypes.STRING(150) },
  address: { type: DataTypes.TEXT },
  city: { type: DataTypes.STRING(120) },
  district: { type: DataTypes.STRING(120) },
  pincode: { type: DataTypes.STRING(20) },
  gst_number: { type: DataTypes.STRING(40) },
  password: { type: DataTypes.STRING(255), allowNull: false },
  is_approved: { type: DataTypes.BOOLEAN, defaultValue: true },
  upi_id: { type: DataTypes.STRING(100) },
  upi_name: { type: DataTypes.STRING(100) },
  profile_picture: { type: DataTypes.STRING(255) },
  bank_name: { type: DataTypes.STRING(100) },
  bank_account_number: { type: DataTypes.STRING(50) },
  bank_ifsc: { type: DataTypes.STRING(20) },
  invoice_terms: { type: DataTypes.TEXT },
  reset_otp: { type: DataTypes.STRING(10) },
  reset_otp_expiry: { type: DataTypes.DATE }
}, {
  tableName: 'shopkeepers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

class ShopkeeperModel {
  static async findByMobile(mobile) {
    const shopkeeper = await Shopkeeper.findOne({ where: { mobile }, raw: true });
    return shopkeeper;
  }

  static async create(shopkeeperData) {
    const shopkeeper = await Shopkeeper.create(shopkeeperData);
    return shopkeeper.id;
  }

  static async findByEmail(email) {
    const shopkeeper = await Shopkeeper.findOne({
      where: { email },
      attributes: ['id', 'reset_otp', 'reset_otp_expiry'],
      raw: true
    });
    return shopkeeper;
  }

  static async findByEmailFull(email) {
    const shopkeeper = await Shopkeeper.findOne({ where: { email }, raw: true });
    return shopkeeper;
  }

  static async updateOtp(email, otp, expiry) {
    await Shopkeeper.update({ reset_otp: otp, reset_otp_expiry: expiry }, { where: { email } });
  }

  static async updatePasswordAndClearOtp(email, hashedPassword) {
    await Shopkeeper.update({
      password: hashedPassword,
      reset_otp: null,
      reset_otp_expiry: null
    }, { where: { email } });
  }
}

module.exports = ShopkeeperModel;

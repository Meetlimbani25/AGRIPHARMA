const db = require('../config/db');

// GET all crops
const getAllCrops = async (req, res) => {
  try {
    const { season } = req.query;
    let query = 'SELECT * FROM crops';
    let params = [];
    if (season) { query += ' WHERE season = ?'; params.push(season); }
    const [crops] = await db.query(query, params);
    res.json({ success: true, total: crops.length, crops });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single crop with weekly schedule
const getCropById = async (req, res) => {
  try {
    const { id } = req.params;
    const [crops] = await db.query('SELECT * FROM crops WHERE id = ?', [id]);
    if (crops.length === 0)
      return res.status(404).json({ success: false, message: 'Crop not found.' });

    const [schedule] = await db.query(
      'SELECT * FROM crop_weekly_schedule WHERE crop_id = ? ORDER BY week_number ASC', [id]
    );

    const [seeds] = await db.query(
      `SELECT s.*, a.price, a.price_unit, a.quantity_value, a.quantity_unit, a.stock
       FROM seeds s
       LEFT JOIN admin_seed_stock a ON s.id = a.seed_id AND a.is_active = 1
       WHERE s.crop_id = ?`, [id]
    );

    res.json({ success: true, crop: crops[0], weekly_schedule: schedule, seeds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET weekly schedule for a crop
const getWeeklySchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { week } = req.query;
    let query = 'SELECT * FROM crop_weekly_schedule WHERE crop_id = ?';
    let params = [id];
    if (week) { query += ' AND week_number = ?'; params.push(week); }
    query += ' ORDER BY week_number ASC';
    const [schedule] = await db.query(query, params);
    res.json({ success: true, total: schedule.length, schedule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllCrops, getCropById, getWeeklySchedule };

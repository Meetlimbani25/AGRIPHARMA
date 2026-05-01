const db       = require('../config/db');
const axios    = require('axios');
const FormData = require('form-data');
const path     = require('path');
const fs       = require('fs');

/**
 * Detects a plant disease from an uploaded image.
 * Forwards the image to a Python ML API and saves the prediction result in the database.
 * If the ML API is unreachable, it falls back to a demo response.
 *
 * @param {Object} req - Express request object containing the uploaded file in req.file
 * @param {Object} res - Express response object
 */
const detectDisease = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, message: 'No image uploaded. Please upload a leaf image.' });

    const imagePath = req.file.path;
    const farmerId  = req.farmer.id;

    let result;

    // Send image to Python Flask ML API
    try {
      const formData = new FormData();
      formData.append('image', fs.createReadStream(imagePath));

      const mlResponse = await axios.post(
        `${process.env.ML_API_URL || 'http://localhost:8000'}/predict`,
        formData,
        { headers: formData.getHeaders(), timeout: 30000 }
      );
      result = mlResponse.data;
    } catch (mlErr) {
      // ML API not running - return demo response
      result = {
        success:     true,
        crop:        'Tomato',
        disease:     'Early Blight',
        severity:    'Medium',
        confidence:  94.5,
        is_healthy:  false,
        description: 'Dark brown spots with concentric rings on older leaves.',
        medicine:    'Apply Mancozeb 75WP every 7-10 days.',
        prevention:  'Remove lower infected leaves, water at base only.',
        organic:     'Neem oil spray 2% twice a week.',
        suggestions: ['Remove lower leaves touching soil', 'Apply mulch', 'Start spraying preventively'],
        top3:        [
          { disease: 'Tomato Early Blight', confidence: 94.5 },
          { disease: 'Tomato Target Spot',  confidence: 3.2  },
          { disease: 'Tomato Healthy',      confidence: 2.3  }
        ],
        mode: 'demo'
      };
    }

    // Save scan result to disease_history table
    const suggestionsText = Array.isArray(result.suggestions) ? result.suggestions.join(' | ') : result.suggestions;

    await db.query(
      `INSERT INTO disease_history
       (farmer_id, image_path, disease_name, confidence_score, crop_name, severity, description, medicine, prevention, organic, suggestions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        farmerId,
        imagePath,
        result.disease,
        result.confidence,
        result.crop,
        result.severity,
        result.description,
        result.medicine,
        result.prevention,
        result.organic,
        suggestionsText
      ]
    );

    // Get matching products from database
    let suggestedProducts = [];
    if (!result.is_healthy && result.medicine) {
      const keyword = result.medicine.split(' ')[1] || result.disease.split(' ')[0];
      const [products] = await db.query(
        `SELECT id, name, price, price_unit, unit, image_url
         FROM products WHERE category = 'medicine' LIMIT 3`
      );
      suggestedProducts = products;
    }

    res.json({
      success:            true,
      result,
      image_saved:        imagePath,
      suggested_products: suggestedProducts
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Retrieves the scanning history for the currently logged-in farmer.
 * Includes pagination support via query parameters.
 *
 * @param {Object} req - Express request object (req.query.page, req.query.limit)
 * @param {Object} res - Express response object
 */
const getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [history] = await db.query(
      `SELECT id, disease_name, crop_name, confidence_score, severity,
              description, medicine, prevention, image_path, scanned_at
       FROM disease_history
       WHERE farmer_id = ?
       ORDER BY scanned_at DESC
       LIMIT ? OFFSET ?`,
      [req.farmer.id, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) as total FROM disease_history WHERE farmer_id = ?',
      [req.farmer.id]
    );

    res.json({ success: true, total, page: parseInt(page), history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Retrieves a specific scan result by its ID for the logged-in farmer.
 *
 * @param {Object} req - Express request object containing scan ID in params
 * @param {Object} res - Express response object
 */
const getScanById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM disease_history WHERE id = ? AND farmer_id = ?',
      [req.params.id, req.farmer.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Scan not found.' });
    res.json({ success: true, scan: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { detectDisease, getHistory, getScanById };

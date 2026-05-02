const db       = require('../config/db');
const axios    = require('axios');
const FormData = require('form-data');
const path     = require('path');
const fs       = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


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

    // Primary Detection Method: Gemini AI
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      try {
        const imageData = fs.readFileSync(imagePath);
        const base64Image = imageData.toString('base64');

        const prompt = `
          Analyze this plant image and provide a disease diagnosis in JSON format.
          The response MUST be a valid JSON object with the following structure:
          {
            "success": true,
            "crop_name": "Crop Name",
            "disease_name": "Disease Name or 'Healthy'",
            "severity": "Low/Medium/High",
            "confidence": 0.0 to 1.0,
            "is_healthy": true/false,
            "description": "Short description of the disease",
            "treatment": "Recommended medicine/chemical control",
            "prevention": "Preventive measures",
            "organic": "Organic control methods",
            "medicines": ["Medicine 1", "Medicine 2"],
            "top3": [
              {"disease": "Disease 1", "confidence": score},
              {"disease": "Disease 2", "confidence": score},
              {"disease": "Disease 3", "confidence": score}
            ]
          }
          If the plant is healthy, set is_healthy to true and describe it accordingly.
          Return ONLY the raw JSON string.
        `;

        const visionResult = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Image,
              mimeType: req.file.mimetype
            }
          }
        ]);

        const responseText = visionResult.response.text();
        const jsonString = responseText.replace(/```json|```/g, '').trim();
        result = JSON.parse(jsonString);
        
        // Ensure result has expected fields for DB and fallback
        result.disease = result.disease_name;
        result.medicine = result.treatment;
        result.crop = result.crop_name;
        result.suggestions = result.medicines;
      } catch (geminiErr) {
        console.error("Gemini Error:", geminiErr);
        result = await fallbackToFlaskOrDemo(imagePath);
      }
    } else {
      result = await fallbackToFlaskOrDemo(imagePath);
    }

    // Save scan result to disease_history table
    const suggestionsText = Array.isArray(result.suggestions || result.medicines) 
      ? (result.suggestions || result.medicines).join(' | ') 
      : (result.suggestions || result.medicines);

    await db.query(
      `INSERT INTO disease_history
       (farmer_id, image_path, disease_name, confidence_score, crop_name, severity, description, medicine, prevention, organic, suggestions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        farmerId,
        imagePath,
        result.disease_name || result.disease,
        result.confidence,
        result.crop_name || result.crop,
        result.severity,
        result.description,
        result.treatment || result.medicine,
        result.prevention,
        result.organic,
        suggestionsText
      ]
    );

    // Get matching products from database
    let suggestedProducts = [];
    if (!result.is_healthy && (result.treatment || result.medicine)) {
      const [products] = await db.query(
        `SELECT id, name, price, price_unit, unit, image_url
         FROM products WHERE category = 'medicine' LIMIT 3`
      );
      suggestedProducts = products;
    }

    // Flatten response for frontend
    res.json({
      success:            true,
      ...result,
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

/**
 * Helper function for fallback detection
 */
async function fallbackToFlaskOrDemo(imagePath) {
  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));

    const mlResponse = await axios.post(
      `${process.env.ML_API_URL || 'http://localhost:8000'}/predict`,
      formData,
      { headers: formData.getHeaders(), timeout: 30000 }
    );
    return mlResponse.data;
  } catch (mlErr) {
    return {
      success:      true,
      crop_name:    'Tomato',
      disease_name: 'Early Blight',
      severity:     'Medium',
      confidence:   0.945,
      is_healthy:   false,
      description:  'Dark brown spots with concentric rings on older leaves.',
      treatment:    'Apply Mancozeb 75WP every 7-10 days.',
      prevention:   'Remove lower infected leaves, water at base only.',
      organic:      'Neem oil spray 2% twice a week.',
      medicines:    ['Mancozeb 75WP', 'Neem Oil'],
      top3:         [
        { disease: 'Tomato Early Blight', confidence: 0.945 },
        { disease: 'Tomato Target Spot',  confidence: 0.032  },
        { disease: 'Tomato Healthy',      confidence: 0.023  }
      ],
      mode: 'demo'
    };

  }
}

module.exports = { detectDisease, getHistory, getScanById };


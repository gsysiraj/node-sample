const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdf = require('pdf-parse');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/parse', upload.single('resume'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
        const data = await pdf(req.file.buffer);
        res.json({ text: data.text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to parse PDF.' });
    }
});

module.exports = router;

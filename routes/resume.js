const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdf = require('pdf-parse');
const axios = require('axios');

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

const { structureResume } = require('../utils/llm_helper');

router.post('/tailor', upload.single('resume'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No resume file uploaded.' });
    }

    const { jobDescription } = req.body;
    if (!jobDescription) {
        return res.status(400).json({ error: 'No job description provided.' });
    }

    try {
        const resumeText = (await pdf(req.file.buffer)).text;
        const structuredResume = await structureResume(resumeText);

        const tailorPrompt = `
            You are a professional resume writer. Your task is to revise the 'Work Experience' section of the following resume to better match the provided job description.
            Focus on highlighting the skills and accomplishments that are most relevant to the role.
            Return only the revised 'Work Experience' section as a JSON array of objects.

            **Original Work Experience:**
            ---
            ${JSON.stringify(structuredResume.experience, null, 2)}
            ---

            **Job Description:**
            ---
            ${jobDescription}
            ---
        `;

        const llmResponse = await axios.post(process.env.LLM_API_URL, {
            model: process.env.LLM_MODEL_NAME,
            prompt: tailorPrompt,
            stream: false
        });

        const responseText = llmResponse.data.response;
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error("Failed to find JSON in LLM response for tailoring.");
        }

        const tailoredExperience = JSON.parse(jsonMatch[0]);

        res.json({
            original_resume: structuredResume,
            tailored_experience: tailoredExperience
        });

    } catch (error) {
        console.error("Error in /tailor endpoint:", error);
        res.status(500).json({ error: 'Failed to tailor resume.' });
    }
});

module.exports = router;

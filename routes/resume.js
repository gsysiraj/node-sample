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

const { structureResume, humanizeText } = require('../utils/llm_helper');

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
            You are a world-class professional resume writer and career coach. Your task is to revise and tailor the provided resume (in JSON format) to perfectly match the given job description.
            Perform a holistic review and revision of the entire resume.

            1.  **Rewrite the 'summary'**: Make it concise, impactful, and align it with the key requirements and language of the job description.
            2.  **Revise the 'experience' descriptions**: Rephrase bullet points using the STAR (Situation, Task, Action, Result) method. Emphasize accomplishments and quantify results. Directly map experiences to the skills and responsibilities listed in the job description.
            3.  **Optimize the 'skills'**: Re-order, group, or add skills to highlight the most relevant qualifications mentioned in the job description.
            4.  **Maintain JSON format**: Return the complete, revised resume as a single, valid JSON object.

            **Original Resume (JSON):**
            ---
            ${JSON.stringify(structuredResume, null, 2)}
            ---

            **Job Description:**
            ---
            ${jobDescription}
            ---

            Return only the full, revised JSON object.
        `;

        const llmResponse = await axios.post(process.env.LLM_API_URL, {
            model: process.env.LLM_MODEL_NAME,
            prompt: tailorPrompt,
            stream: false
        });

        const responseText = llmResponse.data.response;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Failed to find a valid JSON object in the LLM's response.");
        }

        const tailoredResume = JSON.parse(jsonMatch[0]);

        res.json(tailoredResume);

    } catch (error) {
        console.error("Error in /tailor endpoint:", error);
        res.status(500).json({ error: 'Failed to tailor resume.' });
    }
});

router.post('/humanize', async (req, res) => {
    const structuredResume = req.body;

    if (!structuredResume || !structuredResume.experience) {
        return res.status(400).json({ error: 'Invalid resume object provided.' });
    }

    try {
        const humanizedResume = { ...structuredResume };

        // Humanize the summary
        if (humanizedResume.summary) {
            humanizedResume.summary = await humanizeText(humanizedResume.summary);
        }

        // Humanize the experience descriptions
        humanizedResume.experience = await Promise.all(
            humanizedResume.experience.map(async (exp) => {
                if (exp.description) {
                    exp.description = await humanizeText(exp.description);
                }
                return exp;
            })
        );

        res.json(humanizedResume);
    } catch (error) {
        console.error("Error in /humanize endpoint:", error);
        res.status(500).json({ error: 'Failed to humanize resume.' });
    }
});

module.exports = router;

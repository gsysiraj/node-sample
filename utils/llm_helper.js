const axios = require('axios');

async function structureResume(resumeText) {
    const prompt = `
        You are an expert resume parser. Your task is to analyze the raw text from a resume and convert it into a structured JSON object.
        The JSON object should have the following keys: "contact", "summary", "experience", "education", and "skills".
        - "contact": Should be an object containing "name", "email", "phone", and "linkedin".
        - "summary": Should be a string containing the professional summary.
        - "experience": Should be an array of objects, where each object has "title", "company", "dates", and "description".
        - "education": Should be an array of objects, where each object has "degree", "institution", and "year".
        - "skills": Should be an array of strings.

        Here is the resume text:
        ---
        ${resumeText}
        ---

        Please provide only the JSON object in your response.
    `;

    try {
        const response = await axios.post(process.env.LLM_API_URL, {
            model: process.env.LLM_MODEL_NAME,
            prompt: prompt,
            stream: false
        });

        // It's common for LLM responses to be wrapped in markdown, so we need to extract the JSON
        const responseText = response.data.response;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Failed to find JSON in LLM response.");
        }

        return JSON.parse(jsonMatch[0]);

    } catch (error) {
        console.error("Error structuring resume with LLM:", error);
        throw new Error("Failed to structure resume.");
    }
}

module.exports = { structureResume };

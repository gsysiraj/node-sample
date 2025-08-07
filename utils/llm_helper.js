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

async function humanizeText(text) {
    const prompt = `
        You are an expert in professional communication. Your task is to revise the following text to make it sound more natural and human, as if it were written by a person, not an AI.
        - Vary sentence structure and length.
        - Replace corporate jargon with clearer, more direct language.
        - Adjust the tone to be slightly more conversational while maintaining professionalism.
        - Ensure the core meaning and professional impact of the text are preserved.

        Here is the text to revise:
        ---
        ${text}
        ---

        Return only the revised text.
    `;

    try {
        const response = await axios.post(process.env.LLM_API_URL, {
            model: process.env.LLM_MODEL_NAME,
            prompt: prompt,
            stream: false
        });
        // Strip out <think> tags and trim whitespace
        const cleanedResponse = response.data.response.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        return cleanedResponse;
    } catch (error) {
        console.error("Error humanizing text with LLM:", error);
        throw new Error("Failed to humanize text.");
    }
}

module.exports = { structureResume, humanizeText };

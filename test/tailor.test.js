const request = require('supertest');
const app = require('../app');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const { structureResume } = require('../utils/llm_helper');

jest.mock('axios');
jest.mock('../utils/llm_helper');

describe('Resume Tailoring', () => {
    let pdfBuffer;

    beforeAll(() => {
        // Create a dummy pdf for testing
        const pdfPath = path.join(__dirname, 'dummy.pdf');
        // This is a simplified way to get a buffer, for a real test, you'd need a valid pdf buffer
        pdfBuffer = fs.readFileSync(pdfPath);
    });

    it('should tailor a resume and return the tailored experience', async () => {
        const mockStructuredResume = {
            contact: { name: 'John Doe' },
            experience: [{ title: 'Software Engineer', company: 'Tech Corp', description: 'Wrote code.' }],
            education: [],
            skills: []
        };
        const mockTailoredExperience = [{ title: 'Senior Software Engineer', company: 'Big Tech Corp', description: 'Wrote excellent code.' }];

        structureResume.mockResolvedValue(mockStructuredResume);
        axios.post.mockResolvedValue({
            data: {
                response: JSON.stringify(mockTailoredExperience)
            }
        });

        const res = await request(app)
            .post('/api/resume/tailor')
            .attach('resume', pdfBuffer, 'dummy.pdf')
            .field('jobDescription', 'A job requiring excellent code.')
            .expect(200);

        expect(res.body).toHaveProperty('original_resume');
        expect(res.body).toHaveProperty('tailored_experience');
        expect(res.body.original_resume.contact.name).toBe('John Doe');
        expect(res.body.tailored_experience[0].title).toBe('Senior Software Engineer');
    });
});

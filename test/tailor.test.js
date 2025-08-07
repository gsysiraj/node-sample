const request = require('supertest');
const app = require('../app');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const { structureResume } = require('../utils/llm_helper');

jest.mock('axios');

jest.mock('../utils/llm_helper');

describe('Resume Endpoints', () => {
    let pdfBuffer;

    beforeAll(() => {
        // Create a dummy pdf for testing
        const pdfPath = path.join(__dirname, 'dummy.pdf');
        // This is a simplified way to get a buffer, for a real test, you'd need a valid pdf buffer
        pdfBuffer = fs.readFileSync(pdfPath);
    });

    it('should tailor a resume and return the tailored experience', async () => {
        const { structureResume } = require('../utils/llm_helper');
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

        const mockTailoredResume = {
            contact: { name: 'John Doe', email: 'john.doe@example.com' },
            summary: 'A highly motivated and results-oriented Senior Software Engineer.',
            experience: [{ title: 'Senior Software Engineer', company: 'Big Tech Corp', description: 'Wrote excellent, well-tested code.' }],
            education: [],
            skills: ['JavaScript', 'Node.js', 'React']
        };

        structureResume.mockResolvedValue(mockStructuredResume);
        axios.post.mockResolvedValue({
            data: {
                response: JSON.stringify(mockTailoredResume)
            }
        });

        const res = await request(app)
            .post('/api/resume/tailor')
            .attach('resume', pdfBuffer, 'dummy.pdf')
            .field('jobDescription', 'A job requiring excellent code.')
            .expect(200);

        expect(res.body).toHaveProperty('summary');
        expect(res.body.summary).toContain('Senior Software Engineer');
        expect(res.body.experience[0].description).toContain('well-tested');
    });

    it('should humanize a resume and return the humanized resume, stripping think tags', async () => {
        const mockResume = {
            summary: 'Synergized cross-functional teams to leverage core competencies.',
            experience: [{ description: 'Successfully executed the implementation of a new paradigm.' }]
        };

        // Use the real implementation for humanizeText
        const { humanizeText } = jest.requireActual('../utils/llm_helper.js');
        require('../utils/llm_helper').humanizeText.mockImplementation(humanizeText);

        axios.post.mockImplementation(async () => {
            return {
                data: {
                    response: `<think>Okay, I need to make this sound more natural.</think>This has been humanized.`
                }
            };
        });

        const res = await request(app)
            .post('/api/resume/humanize')
            .send(mockResume)
            .expect(200);

        expect(res.body.summary).toBe('This has been humanized.');
        expect(res.body.experience[0].description).toBe('This has been humanized.');
    });
});

const request = require('supertest');
const app = require('../app');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

describe('PDF Parsing', () => {
    let pdfBuffer;

    beforeAll(async () => {
        const pdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
        const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
        pdfBuffer = response.data;
    });

    it('should parse a PDF file and return the text', async () => {
        const res = await request(app)
            .post('/api/resume/parse')
            .attach('resume', pdfBuffer, 'dummy.pdf')
            .expect(200);

        expect(res.body).toHaveProperty('text');
        expect(res.body.text).toContain('Dummy PDF file');
    });
});

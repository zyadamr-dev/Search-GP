import request from 'supertest';
import { app } from '../app.js'
import path from 'path';
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('SearchController APIs', () => {
  const headers = { 'x-user-id': 9 };

  it('POST api/v1/search/image - should upload image and search', async () => {
    const res = await request(app)
      .post('/api/v1/search/image')
      .set(headers)
      .attach('image', path.join(__dirname, 'test.png'))
      .timeout(10000);  

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('imageUrl');
    expect(res.body).toHaveProperty('results');
  }, 20000);

  it('POST api/v1/search/text - should search by text', async () => {
    const res = await request(app)
      .post('/api/v1/search/text')
      .set(headers)
      .send({ text: 'white shirt' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('text');
    expect(res.body).toHaveProperty('results');
  });

  it('POST api/v1/search/combined - should search by image and text', async () => {
    const res = await request(app)
      .post('/api/v1/search/combined')
      .set(headers)
      .field('text', 'yellow suit')
      .attach('image', path.resolve(__dirname, 'test.png'))
      .timeout(20000)

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('results');
  }, 20000); // cz it falls away when it exceeds 5 sec

  it('GET api/v1/search/similar/:id - should retrieve similar items', async () => {
    const res = await request(app)
      .get('/api/v1/search/similar/1')
      .set(headers)

    expect([200, 404]).toContain(res.status); 
  }, 10000);
});

const request = require('supertest');
const mongoose = require('mongoose');
const express = require("express");
const app = express();

// Mock the User model for testing purposes
jest.mock('./User', () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

// Mock the OpenAI API for testing purposes
jest.mock('openai', () => ({
  Configuration: jest.fn(),
  OpenAIApi: jest.fn(),
}));

describe('Chat Application', () => {
  beforeAll(async () => {
    // Connect to a test MongoDB database
    await mongoose.connect(`mongodb:+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.uhp24dd.mongodb.net/?retryWrites=true&w=majority`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    // Disconnect from the test database
    await mongoose.disconnect();
  });

  describe('GET /', () => {
    it('should render the registration page', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.text).toContain('Registration');
    });
  });

  describe('POST /register', () => {
    it('should create a new user and redirect to the chat room', async () => {
      // Mock the User.findOneAndUpdate method to return a user without an invite link
      const MockUser = require('./User');
      MockUser.findOneAndUpdate.mockResolvedValueOnce({
        username: 'testuser',
        password: 'testpassword',
        save: jest.fn(),
      });

      const response = await request(app)
        .post('/register')
        .send({ username: 'testuser', password: 'testpassword' });

      expect(response.status).toBe(302);
      expect(response.header.location).toMatch(/\/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/);
    });
  });

  describe('GET /:room', () => {
    it('should render the chat room page with the specified room ID', async () => {
      const response = await request(app).get('/abcdefg12345678');
      expect(response.status).toBe(200);
      expect(response.text).toContain('Chat Room');
      expect(response.text).toContain('abcdefg12345678');
    });
  });

  // Write more tests to cover other functionalities

});

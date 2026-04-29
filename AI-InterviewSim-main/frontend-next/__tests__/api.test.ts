jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
    },
  },
}));

// Mock axios
const mockPost = jest.fn();
const mockGet = jest.fn();

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: mockPost,
    get: mockGet,
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  })),
  default: {
    create: jest.fn(() => ({
      post: mockPost,
      get: mockGet,
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    })),
  },
}));

describe('Interview API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parseResume sends form data', async () => {
    const mockResponse = { data: { success: true, data: { name: 'Test User' } } };
    mockPost.mockResolvedValueOnce(mockResponse);

    jest.resetModules();
    const { interviewAPI } = require('../lib/api');
    
    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'test.pdf');

    const result = await interviewAPI.parseResume(formData);
    expect(result.success).toBe(true);
  });

  it('startInterview returns session data', async () => {
    const mockResponse = { data: { success: true, session_id: 'test-id', question: 'Q1' } };
    mockPost.mockResolvedValueOnce(mockResponse);

    jest.resetModules();
    const { interviewAPI } = require('../lib/api');
    
    const result = await interviewAPI.startInterview('Developer', 5);
    expect(result.session_id).toBe('test-id');
  });

  it('submitAnswer returns next question', async () => {
    const mockResponse = { data: { success: true, nextQuestion: 'Q2' } };
    mockPost.mockResolvedValueOnce(mockResponse);

    jest.resetModules();
    const { interviewAPI } = require('../lib/api');
    
    const result = await interviewAPI.submitAnswer('My answer', 'sess-123');
    expect(result.nextQuestion).toBe('Q2');
  });

  it('generateFeedback returns scores', async () => {
    const mockResponse = { data: { success: true, feedback: { overall: 85 } } };
    mockPost.mockResolvedValueOnce(mockResponse);

    jest.resetModules();
    const { interviewAPI } = require('../lib/api');
    
    const result = await interviewAPI.generateFeedback();
    expect(result.feedback.overall).toBe(85);
  });

  it('getHistory returns interviews', async () => {
    const mockResponse = { data: { success: true, history: [{ id: 1, role: 'Developer' }] } };
    mockGet.mockResolvedValueOnce(mockResponse);

    jest.resetModules();
    const { interviewAPI } = require('../lib/api');
    
    const result = await interviewAPI.getHistory();
    expect(result.history).toHaveLength(1);
  });
});

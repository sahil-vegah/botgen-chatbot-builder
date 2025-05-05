import axios from 'axios';

// API configuration
const API_CONFIG = {
  baseUrl: 'http://localhost:8000/api',
  timeout: 60000, // Default timeout (60 seconds)
  longTimeout: 300000, // Long timeout for crawling operations (5 minutes)
  retryAttempts: 2
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Check if the API is available
 * @returns {Promise<boolean>} Whether the API is available
 */
export const apiHealthCheck = async () => {
  try {
    const response = await axios.get(`${API_CONFIG.baseUrl}/health`, {
      timeout: 5000 // Short timeout for health check
    });
    return response.status === 200;
  } catch (error) {
    console.error('API health check error:', error);
    return false;
  }
};

/**
 * Generate a chatbot based on a website URL
 * @param {Object} config - Chatbot configuration
 * @returns {Promise<Object>} Generated chatbot data
 */
export const generateChatbot = async (config) => {
  try {
    // Map frontend config to FastAPI expected format
    const crawlRequest = {
      url: config.websiteUrl,
      max_concurrent: 3
    };

    // Create a new instance with longer timeout for this specific request
    const response = await axios.post(
      `${API_CONFIG.baseUrl}/crawl`,
      crawlRequest,
      { timeout: API_CONFIG.longTimeout }
    );

    if (response.data.success) {
      return {
        chatbotId: response.data.data.table_name,
        status: 'success',
        message: response.data.message
      };
    } else {
      throw new Error(response.data.message || 'Failed to generate chatbot');
    }
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Crawling websites can take a long time, especially for larger sites.');
    }
    if (error.response) {
      throw new Error(error.response.data.message || `HTTP error! Status: ${error.response.status}`);
    }
    throw error;
  }
};

/**
 * Get chatbot information by ID
 * @param {string} chatbotId - The ID of the chatbot
 * @returns {Promise<Object>} Chatbot data
 */
export const getChatbot = async (chatbotId) => {
  try {
    const response = await apiClient.get(`/chatbot/${chatbotId}`);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to get chatbot');
    }
  } catch (error) {
    console.error('Error getting chatbot:', error);
    throw handleApiError(error);
  }
};

/**
 * Send a message to the chatbot
 * @param {Object} params - Chat parameters
 * @param {string} params.tableName - The table name/chatbot ID
 * @param {string} params.question - The user's question
 * @param {string} params.modelType - The model type (Groq or Ollama)
 * @param {boolean} params.isVoice - Whether voice is enabled
 * @param {string} params.voice - The voice model to use
 * @param {number} params.temperature - The temperature setting
 * @returns {Promise<Object>} Chat response
 */
export const sendChatMessage = async ({ 
  tableName, 
  question, 
  modelType = 'Groq', 
  isVoice = false, 
  voice = 'Fritz-PlayAI',
  temperature = 0.1
}) => {
  try {
    const chatRequest = {
      table_name: tableName,
      question,
      model_type: modelType,
      is_voice: isVoice,
      voice,
      temperature
    };

    const response = await apiClient.post('/chat', chatRequest);

    if (response.data.success) {
      return {
        message: response.data.data.answer,
        timestamp: new Date().toISOString(),
        audioUrl: response.data.data.audio_url
      };
    } else {
      throw new Error(response.data.message || 'Failed to get response from chatbot');
    }
  } catch (error) {
    console.error('Error sending message to chatbot:', error);
    throw handleApiError(error);
  }
};

/**
 * Transcribe audio to text
 * @param {File} audioFile - Audio file to transcribe
 * @returns {Promise<Object>} Transcription response
 */
export const transcribeAudio = async (audioFile) => {
  try {
    const formData = new FormData();
    formData.append('file', audioFile);

    const response = await axios.post(
      `${API_CONFIG.baseUrl}/transcribe`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to transcribe audio');
    }
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw handleApiError(error);
  }
};

/**
 * Helper function to handle API errors
 * @param {Error} error - The error object
 * @returns {Error} Processed error
 */
const handleApiError = (error) => {
  if (error.code === 'ECONNABORTED') {
    return new Error('Request timed out. Please try again later.');
  }
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const message = error.response.data.message || `HTTP error! Status: ${error.response.status}`;
    return new Error(message);
  }
  
  if (error.request) {
    // The request was made but no response was received
    return new Error('No response received from server. Please check if the server is running.');
  }
  
  // Something else happened in setting up the request
  return error;
}; 
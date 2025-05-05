/**
 * Utility helper functions for the app
 */

/**
 * Validates if a string is a valid URL
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
export const isValidUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

/**
 * Sanitizes a string by removing potentially harmful characters
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (input) => {
  if (!input || typeof input !== 'string') return '';
  
  // Basic sanitization to prevent XSS
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy text: ', error);
    return false;
  }
};

/**
 * Format a domain from a URL
 * @param {string} url - URL to extract domain from
 * @returns {string} - Formatted domain
 */
export const formatDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (_) {
    return url;
  }
};

/**
 * Play audio from a URL
 * @param {string} audioUrl - URL of the audio to play
 * @returns {Promise<void>}
 */
export const playAudio = async (audioUrl) => {
  try {
    const audio = new Audio(audioUrl);
    await audio.play();
  } catch (error) {
    console.error('Error playing audio:', error);
    throw new Error('Error playing audio response');
  }
};

/**
 * Record audio from the user's microphone
 * @param {function} onRecordingStart - Callback when recording starts
 * @param {function} onRecordingStop - Callback when recording stops
 * @returns {Object} - Recording controls
 */
export const recordAudio = (onRecordingStart, onRecordingStop) => {
  let mediaRecorder;
  let audioChunks = [];
  
  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.addEventListener('dataavailable', (event) => {
        audioChunks.push(event.data);
      });
      
      mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        onRecordingStop && onRecordingStop(audioBlob, audioUrl);
        audioChunks = [];
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      });
      
      // Start recording
      mediaRecorder.start();
      onRecordingStart && onRecordingStart();
      
      return true;
    } catch (error) {
      console.error('Error starting audio recording:', error);
      return false;
    }
  };
  
  const stop = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      return true;
    }
    return false;
  };
  
  return { start, stop };
}; 
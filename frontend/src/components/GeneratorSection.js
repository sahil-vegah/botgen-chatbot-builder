import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { FaGlobe, FaRobot, FaMicrophone, FaStop } from 'react-icons/fa';
import { isValidUrl, sanitizeString } from '../utils/helpers';
import { generateChatbot, transcribeAudio } from '../services/api';
import { recordAudio } from '../utils/helpers';

const Section = styled.section`
  flex: 1;
  min-width: 300px;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: var(--card-shadow);
  padding: 25px;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: var(--text-color);
`;

const ErrorContainer = styled.div`
  color: var(--error-color);
  background-color: rgba(244, 67, 54, 0.1);
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 15px;
  font-size: 0.9rem;
  display: none;
  
  &.visible {
    display: block;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-color);
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.95rem;
  transition: var(--transition);
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(156, 28, 35, 0.2);
  }
  
  &.error {
    border-color: var(--error-color);
  }
`;

const InputIcon = styled.span`
  position: absolute;
  left: 12px;
  color: var(--text-light);
  font-size: 1rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.95rem;
  background-color: white;
  transition: var(--transition);
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(156, 28, 35, 0.2);
  }
`;

const ModelInfo = styled.small`
  display: block;
  margin-top: 6px;
  color: var(--text-light);
  font-size: 0.8rem;
`;

const SliderContainer = styled.div`
  margin-top: 10px;
`;

const SliderWrapper = styled.div`
  position: relative;
  height: 30px;
  display: flex;
  align-items: center;
  padding: 0 10px;
`;

const SliderLabels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
`;

const SliderLabel = styled.span`
  font-size: 0.8rem;
  color: var(--text-light);
`;

const Slider = styled.input`
  width: 100%;
  -webkit-appearance: none;
  height: 6px;
  border-radius: 3px;
  background: #e0e0e0;
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--primary-color);
    cursor: pointer;
    transition: var(--transition);
  }
  
  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--primary-color);
    cursor: pointer;
    transition: var(--transition);
    border: none;
  }
  
  &::-webkit-slider-thumb:hover {
    background: var(--primary-light);
    transform: scale(1.1);
  }
  
  &::-moz-range-thumb:hover {
    background: var(--primary-light);
    transform: scale(1.1);
  }
`;

const TemperatureValue = styled.span`
  position: absolute;
  top: -20px;
  left: ${props => props.position}%;
  transform: translateX(-50%);
  background-color: var(--primary-color);
  color: white;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 4px;
  
  &:after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 4px;
    border-style: solid;
    border-color: var(--primary-color) transparent transparent transparent;
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
`;

const ToggleLabel = styled.span`
  margin-left: 10px;
  font-size: 0.95rem;
  color: var(--text-color);
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: var(--transition);
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: var(--transition);
    border-radius: 50%;
  }
  
  input:checked + & {
    background-color: var(--primary-color);
  }
  
  input:checked + &:before {
    transform: translateX(26px);
  }
`;

const VoiceModelContainer = styled.div`
  margin-top: 10px;
  display: ${props => props.visible ? 'block' : 'none'};
`;

const ErrorMessage = styled.div`
  color: var(--error-color);
  font-size: 0.85rem;
  margin-top: 5px;
  display: none;
  
  &.visible {
    display: block;
  }
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 12px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  
  &:hover {
    background-color: var(--primary-light);
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  svg {
    margin-right: 8px;
  }
`;

const GeneratorSection = ({ setCurrentChatbotId, setCurrentTemperature, showNotification }) => {
  const [url, setUrl] = useState('');
  const [languageModel, setLanguageModel] = useState('Groq');
  const [temperature, setTemperature] = useState(0.1);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceModel, setVoiceModel] = useState('Fritz-PlayAI');
  const [isGenerating, setIsGenerating] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  // Create a ref for the recorder
  const recorderRef = useRef(null);
  
  // Calculate slider position for temperature display
  const calculateSliderPosition = () => {
    return ((temperature - 0) / (1 - 0)) * 100;
  };
  
  const handleTemperatureChange = (e) => {
    setTemperature(parseFloat(e.target.value));
  };
  
  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    validateUrl(e.target.value);
  };
  
  const validateUrl = (url) => {
    if (!url) {
      setUrlError('');
      return false;
    }
    
    if (!isValidUrl(url)) {
      setUrlError('Please enter a valid URL');
      return false;
    }
    
    setUrlError('');
    return true;
  };
  
  const toggleVoiceInput = () => {
    setVoiceEnabled(!voiceEnabled);
  };
  
  const handleSubmit = async () => {
    // Clear previous errors
    setErrorMessage('');
    
    // Validate URL
    if (!validateUrl(url)) {
      if (!url) {
        setUrlError('Please enter a website URL');
      }
      return;
    }
    
    try {
      // Set generating state
      setIsGenerating(true);
      
      // Show notification
      showNotification('Analyzing website content. This may take a few minutes for larger sites...', 'info', 10000);
      
      // Call API to generate chatbot
      const config = {
        websiteUrl: sanitizeString(url),
        languageModel,
        temperature,
        voiceEnabled,
        voiceModel: voiceEnabled ? voiceModel : null
      };
      
      const result = await generateChatbot(config);
      
      // Update parent state
      setCurrentChatbotId(result.chatbotId);
      setCurrentTemperature(temperature);
      
      // Show success notification
      showNotification('Chatbot generated successfully!', 'success', 5000);
      
    } catch (error) {
      // Show error in UI
      setErrorMessage(error.message || 'Failed to generate chatbot');
      
      // Show error notification
      showNotification(
        error.message || 'Failed to generate chatbot',
        'error',
        10000
      );
      
    } finally {
      // Reset generating state
      setIsGenerating(false);
    }
  };
  
  // Start voice recording
  const startRecording = async () => {
    if (isRecording) return;
    
    recorderRef.current = recordAudio(
      // onRecordingStart
      () => {
        setIsRecording(true);
        showNotification('Recording started...', 'info', 2000);
      },
      // onRecordingStop
      async (audioBlob) => {
        setIsRecording(false);
        showNotification('Processing audio...', 'info', 2000);
        
        try {
          // Send audio to API for transcription
          const result = await transcribeAudio(audioBlob);
          
          // Set transcribed text as URL
          if (result && result.text) {
            setUrl(result.text);
            validateUrl(result.text);
          }
        } catch (error) {
          showNotification('Failed to transcribe audio: ' + (error.message || 'Unknown error'), 'error', 5000);
        }
      }
    );
    
    const success = await recorderRef.current.start();
    if (!success) {
      showNotification('Failed to access microphone. Please check permissions.', 'error', 5000);
    }
  };
  
  // Stop voice recording
  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
    }
  };
  
  return (
    <Section>
      <Card>
        <Title>Generate Your Chatbot</Title>
        
        <ErrorContainer className={errorMessage ? 'visible' : ''}>
          {errorMessage}
        </ErrorContainer>
        
        <FormGroup>
          <Label htmlFor="website-url">Website URL</Label>
          <InputWrapper>
            <InputIcon>
              <FaGlobe />
            </InputIcon>
            <Input
              type="url"
              id="website-url"
              placeholder="https://your-website.com"
              value={url}
              onChange={handleUrlChange}
              className={urlError ? 'error' : ''}
            />
            {!isRecording ? (
              <FaMicrophone 
                style={{
                  position: 'absolute',
                  right: '12px',
                  cursor: 'pointer',
                  color: 'var(--text-light)'
                }}
                onClick={startRecording}
              />
            ) : (
              <FaStop 
                style={{
                  position: 'absolute',
                  right: '12px',
                  cursor: 'pointer',
                  color: 'var(--error-color)'
                }}
                onClick={stopRecording}
              />
            )}
          </InputWrapper>
          <ErrorMessage className={urlError ? 'visible' : ''}>
            {urlError}
          </ErrorMessage>
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="language-model">Language Model</Label>
          <Select
            id="language-model"
            value={languageModel}
            onChange={(e) => setLanguageModel(e.target.value)}
          >
            <option value="Groq">Llama 4 Scout (meta-llama/llama-4-scout-17b-16e-instruct)</option>
            <option value="Ollama">Ollama (Local Model)</option>
          </Select>
          <ModelInfo>
            Groq uses cloud-based Llama 4 Scout model. Ollama uses your locally installed model specified in .env file.
          </ModelInfo>
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="temperature">Temperature</Label>
          <SliderContainer>
            <SliderLabels>
              <SliderLabel>Precise</SliderLabel>
              <SliderLabel>Creative</SliderLabel>
            </SliderLabels>
            <SliderWrapper>
              <Slider
                type="range"
                id="temperature"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={handleTemperatureChange}
              />
              <TemperatureValue position={calculateSliderPosition()}>
                {temperature}
              </TemperatureValue>
            </SliderWrapper>
          </SliderContainer>
          <ModelInfo>
            Controls randomness. Lower values give more consistent, focused answers.
          </ModelInfo>
        </FormGroup>
        
        <FormGroup>
          <ToggleContainer>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={toggleVoiceInput}
              />
              <ToggleSlider />
            </ToggleSwitch>
            <ToggleLabel>Enable Voice Input</ToggleLabel>
          </ToggleContainer>
          
          <VoiceModelContainer visible={voiceEnabled}>
            <Label htmlFor="voice-model">Voice Model</Label>
            <Select
              id="voice-model"
              value={voiceModel}
              onChange={(e) => setVoiceModel(e.target.value)}
            >
              <option value="Fritz-PlayAI">Fritz (Default)</option>
              <option value="Alice-PlayAI">Alice</option>
              <option value="Bella-PlayAI">Bella</option>
              <option value="Charlie-PlayAI">Charlie</option>
              <option value="Daniel-PlayAI">Daniel</option>
              <option value="Emma-PlayAI">Emma</option>
            </Select>
            <ModelInfo>
              Voices provided by Groq's PlayAI Text-to-Speech service.
            </ModelInfo>
          </VoiceModelContainer>
        </FormGroup>
        
        <SubmitButton 
          onClick={handleSubmit} 
          disabled={isGenerating || !url || !!urlError}
        >
          <FaRobot />
          {isGenerating ? 'Generating...' : 'Create Chatbot'}
        </SubmitButton>
      </Card>
    </Section>
  );
};

export default GeneratorSection; 
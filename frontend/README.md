# BotGen Frontend

This is the React-based frontend for the BotGen chatbot builder application. It allows users to create and interact with AI chatbots that can answer questions about any website.

## Features

- Generate website-specific chatbots using advanced AI models
- Chat interface to test generated chatbots
- Voice input and text-to-speech capabilities
- Integration code for embedding chatbots on your website

## Technologies Used

- React 18
- Styled Components
- Axios for API communication
- React Icons

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- FastAPI backend running (see root README.md)

### Installation

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
npm start
```

The application will open at [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App

## Connecting to the Backend

The frontend is configured to connect to the FastAPI backend running at `http://localhost:8000`. This is configured in the `src/services/api.js` file and can be modified if needed.

## Project Structure

- `src/`
  - `components/` - React components
  - `services/` - API service functions
  - `styles/` - Styled-components and global styles
  - `utils/` - Helper utilities
  - `assets/` - Static assets like images

## License

This project is licensed under the MIT License. 
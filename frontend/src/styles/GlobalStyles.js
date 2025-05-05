import { createGlobalStyle } from 'styled-components';
import bgAntsq from '../assets/images/bg-antsq.webp';

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    --primary-color: #9C1C23;
    --primary-light: #B82A31;
    --secondary-color: #FFF5F5;
    --text-color: #333;
    --text-light: #666;
    --border-color: #E0E0E0;
    --success-color: #4CAF50;
    --error-color: #F44336;
    --warning-color: #FF9800;
    --info-color: #2196F3;
    --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    --transition: all 0.3s ease;
  }

  body {
    font-family: 'Inter', sans-serif;
    line-height: 1.6;
    color: var(--text-color);
    background-image: url(${bgAntsq});
    background-size: cover;
    background-attachment: fixed;
    background-position: center;
    padding: 20px;
    position: relative;
  }

  body::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 245, 245, 0.9);
    z-index: -1;
  }

  h1 {
    font-size: 2.2rem;
    color: var(--primary-color);
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: 20px;
    color: var(--text-color);
  }

  /* Error Messages */
  .error-message {
    color: var(--error-color);
    font-size: 0.85rem;
    margin-top: 5px;
    display: none;
  }

  .error-message.visible {
    display: block;
  }

  @keyframes notification-slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes notification-slide-out {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  @media (max-width: 992px) {
    .content-wrapper {
      flex-direction: column;
    }
  }

  @media (max-width: 768px) {
    body {
      padding: 15px;
    }

    h1 {
      font-size: 1.8rem;
    }

    h2 {
      font-size: 1.3rem;
    }
  }

  @media (max-width: 480px) {
    body {
      padding: 10px;
    }

    h1 {
      font-size: 1.5rem;
    }
  }
`;

export default GlobalStyles; 
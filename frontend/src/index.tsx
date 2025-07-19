import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.scss';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { StoreProvider } from './store';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Добавляем проверку на наличие элемента 'root'
if (!document.getElementById('root')) {
  console.error("Element with id 'root' not found in DOM. Check your HTML structure.");
} else {
  root.render(
    <React.StrictMode>
      <StoreProvider>
        <I18nextProvider i18n={i18n}>
          <BrowserRouter basename="/">
            <App />
          </BrowserRouter>
        </I18nextProvider>
      </StoreProvider>
    </React.StrictMode>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(); 
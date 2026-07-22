import React from 'react';
import RegisterForm from './components/RegisterForm';
import FloatingFoodIcons from './components/FloatingFoodIcons';
import logo from './assets/logo.png';
import './App.css';

function App() {
  return (
    <div className="app-container">
      {/* Decorative Background Elements */}
      <div className="blur-circle circle-1"></div>
      <div className="blur-circle circle-2"></div>
      <FloatingFoodIcons />
      
      <header className="app-header">
        <div className="logo-container">
          <img src={logo} className="company-logo" alt="Vandi Kadai Logo" />
        </div>
      </header>

      <main className="app-main">
        <RegisterForm />
      </main>

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} UNIPRO . All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;

import React, { Component } from 'react';
import Stores from './Stores/Stores';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to the<br/>Object Store Manager</h1>
        </header>
        <br/>
        <Stores></Stores>
      </div>
    );
  }
}

export default App;

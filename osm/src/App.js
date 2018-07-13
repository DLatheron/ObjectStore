import React, { Component } from 'react';
import Stores from './Stores/Stores';
import NavBar from './NavBar';
import StoreContents from './Stores/StoreContents';
import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Route } from 'react-router-dom';

class App extends Component {
    render() {
        return (
            <div className='App'>
                <header className='App-header'>
                    <img src={logo} className='App-logo' alt='logo' />
                    <h1 className='App-title'>Welcome to the<br/>Object Store Manager</h1>
                  </header>
                <NavBar />
                <BrowserRouter>
                    <div>
                        <Route exact path='/' component={Stores} />
                        <Route exact path='/stores' component={Stores} />
                        <Route exact path='/store/:storeId' component={StoreContents}/>
                    </div>
                </BrowserRouter>
            </div>
        );
    }
}

export default App;

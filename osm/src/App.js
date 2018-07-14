import React, { Component } from 'react';
import Stores from './Stores/Stores';
import NavBar from './NavBar';
import StoreContents from './Stores/StoreContents';
// import logo from './logo.svg';
import Home from './Home';
import './App.css';
import { BrowserRouter, Route } from 'react-router-dom';

class App extends Component {
    constructor(props) {
        super(props);

        this._navbar = null;
    }

    render() {
        return (
            <div className='App'>
                <BrowserRouter>
                    <div>
                      <NavBar ref={component => this._navbar = component} />
                      <div className='container-fluid'>
                          <Route exact path='/' component={Home} />
                          <Route exact path='/stores' component={Stores} />
                          <Route exact path='/store/:storeId' component={StoreContents}/>
                      </div>
                    </div>
                </BrowserRouter>
            </div>
        );
    }
}

export default App;

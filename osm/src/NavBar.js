import React from 'react';

function NavBar() {
    return (
        <nav className='navbar navbar-inverse'>
            <div className='container-fluid'>
                <div class='navbar-header'>
                    <a className='navbar-brand' href='#'>
                        <p>OSM</p>
                    </a>
                </div>
                <div className='' id='bs-example-navbar-collapse-1'>
                    <ul className='nav navbar-nav'>
                        <li className='active'>
                            <a href='#'>Stores <span className='sr-only'>(current)</span></a
                        ></li>
                        <li><a href='#'>Link</a></li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default NavBar;

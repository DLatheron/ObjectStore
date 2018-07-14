import React, { Component } from 'react';

class NavBar extends Component {
    constructor(props) {
        super(props);

        this.sections = [
            {
                name: 'Home',
                url: '/',
                path: /^\/$/
            },
            {
                name: 'Stores',
                url: '/stores',
                path: /^\/stores$/
            },
            {
                name: 'Objects',
                path: /^\/store\/[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
            }
        ];
    }

    isActiveSection({ path }) {
        const currentPath = window.location.pathname;

        return currentPath.match(path);
    }

    render() {
        return (
            <div>
                <nav className='navbar navbar-expand-sm sticky-top navbar-dark bg-dark'>
                    <a className='navbar-brand' href='/'>OSM</a>
                    <button className='navbar-toggler' type='button' data-toggle='collapse' data-target='#navbarNav' aria-controls='navbarNav' aria-expanded='false' aria-label='Toggle navigation'>
                        <span className='navbar-toggler-icon'></span>
                    </button>
                    <div className='collapse navbar-collapse' id='navbarNav'>
                        <ul className='navbar-nav'>
                            {
                                this.sections.map(section => {
                                    const sectionClasses = ['nav-item'];
                                    const linkClasses = ['nav-link'];

                                    if (this.isActiveSection(section)) {
                                        sectionClasses.push('active');
                                    }

                                    if (!section.url) {
                                        linkClasses.push('disabled');
                                    }

                                    return (
                                        <li key={section.name} className={sectionClasses.join(' ')}>
                                            <a className={linkClasses.join(' ')} href={section.url}>{section.name}</a>
                                        </li>
                                    );
                                })
                            }
                        </ul>
                    </div>
                </nav>
            </div>
        );
    }
}

export default NavBar;

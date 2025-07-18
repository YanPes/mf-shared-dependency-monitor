import React from 'react';
import styles from './popup.module.scss';
import { DependencyContainer } from '../dependency-container/dependeny-container.tsx';

export const Popup = () => {
    return (
        <>
            <header>
                <h1>Module Federation Share Dependency Monitor</h1>
            </header>
            <main>
                <h2>Overview</h2>
                <DependencyContainer name={"Test"}/>
                <h2>Details</h2>
            </main>
        </>
    )
}
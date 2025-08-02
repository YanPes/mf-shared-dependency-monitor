import React, { useEffect, useState } from 'react';
import styles from './popup.module.scss';
import { DependencyContainer } from '../dependency-container/dependeny-container.tsx';
import { __PRELOADED_MAP__ } from '../../../static-data.ts';

export const Popup = () => {

  const getFederationDataFromCurrentTab = async () => {
    const [tab] = await chrome?.tabs.query({ active: true, currentWindow: true });
    console.log(tab)
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const keyValue = (window as any).__FEDERATION__;
        chrome.runtime.sendMessage({ keyValue });
      }
    })
  }

  useEffect(() => {
    chrome.storage.local.get('__FEDERATION__', (result) => {
      console.log('Retrieved federation data:', result.__FEDERATION__);
    });
  }, []);

  return (
    <>
      <header>
        <h1>Module Federation Share Dependency Monitor</h1>
      </header>
      <main>
        <section>
          <button onClick={getFederationDataFromCurrentTab}>Get Federation Runtime Data</button>
        </section>
        <section>
          <h2>Preloaded Maps</h2>
          <ul>
          </ul>
        </section>

      </main>
    </>
  )
}

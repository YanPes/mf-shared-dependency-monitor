import React, { useEffect, useState } from 'react';
import styles from './popup.module.scss';
import { DependencyContainer } from '../dependency-container/dependeny-container.tsx';

export const Popup = () => {
  const [federationData, setFederationData] = useState<any>(null);
  const getFederationDataFromCurrentTab = async () => {
    const [tab] = await chrome?.tabs.query({ active: true, currentWindow: true });
    console.log(tab)
    chrome.scripting.executeScript({
      target: { tabId: Number(tab.id) },
      func: () => {
        const keyValue = (window as any).__FEDERATION__;
        chrome.runtime.sendMessage({ keyValue });
      }
    })
  }

  useEffect(() => {
    if (!federationData) {
      chrome.storage.local.get('__FEDERATION__', (result) => {
        setFederationData(result?.__FEDERATION__?.payload)
      });
    }
  }, [federationData]);

  console.log("federation data ", JSON.parse(federationData))

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
            {/* {federationData && Object.keys(federationData).map(item => <li>{JSON.stringify(item)}</li>)} */}
          </ul>
        </section>

      </main>
    </>
  )
}

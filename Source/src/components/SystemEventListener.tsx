import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';

export default function SystemEventListener() {
  const [system, setSystem] = useState<any>(null);
  const [network, setNetwork] = useState<any>(null);

  useEffect(() => {
    let unlistenSys: (() => Promise<void>) | undefined;
    let unlistenNet: (() => Promise<void>) | undefined;

    (async () => {
      try {
        unlistenSys = await listen('system:update', (event) => {
          setSystem(event.payload);
          console.debug('system:update', event.payload);
        });

        unlistenNet = await listen('network:update', (event) => {
          setNetwork(event.payload);
          console.debug('network:update', event.payload);
        });
      } catch (e) {
        console.warn('Failed to attach Tauri listeners', e);
      }
    })();

    return () => {
      if (unlistenSys) unlistenSys();
      if (unlistenNet) unlistenNet();
    };
  }, []);

  // expose latest values to window for quick inspection in dev
  useEffect(() => {
    // @ts-ignore
    window.__URMS_SYSTEM = system;
    // @ts-ignore
    window.__URMS_NETWORK = network;
  }, [system, network]);

  return null;
}

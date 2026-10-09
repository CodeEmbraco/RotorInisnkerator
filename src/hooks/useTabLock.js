import { useEffect, useRef, useState, useCallback } from "react";

function safeGetItem(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(storage, key, value) {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function generateTabId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useTabLock(scope) {
  const ownerKey = `paletization_owner_${scope}`;
  const tabIdKey = `paletization_tab_id_${scope}`;
  const channelName = `paletization_lock_${scope}`;

  const tabIdRef = useRef(null);
  const channelRef = useRef(null);
  const [status, setStatus] = useState("owner");

  useEffect(() => {
    let tabId = safeGetItem(sessionStorage, tabIdKey);
    if (!tabId) {
      tabId = generateTabId();
      safeSetItem(sessionStorage, tabIdKey, tabId);
    }
    tabIdRef.current = tabId;

    const currentOwner = safeGetItem(localStorage, ownerKey);
    if (!currentOwner || currentOwner === tabId) {
      safeSetItem(localStorage, ownerKey, tabId);
      setStatus("owner");
    } else {
      setStatus("blocked");
    }

    if (typeof BroadcastChannel !== "undefined") {
      try {
        const channel = new BroadcastChannel(channelName);
        channel.onmessage = (event) => {
          const data = event.data;
          if (
            data &&
            data.type === "takeover" &&
            data.newOwner &&
            data.newOwner !== tabIdRef.current
          ) {
            setStatus("blocked");
          }
        };
        channelRef.current = channel;
      } catch {
        channelRef.current = null;
      }
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
    };
  }, [ownerKey, tabIdKey, channelName]);

  const forceTakeover = useCallback(() => {
    const tabId = tabIdRef.current;
    if (!tabId) return;
    safeSetItem(localStorage, ownerKey, tabId);
    if (channelRef.current) {
      try {
        channelRef.current.postMessage({ type: "takeover", newOwner: tabId });
      } catch {
        /* ignore */
      }
    }
    setStatus("owner");
  }, [ownerKey]);

  return { status, forceTakeover };
}

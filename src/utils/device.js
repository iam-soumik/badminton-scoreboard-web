export function getDeviceId() {
  let deviceId = localStorage.getItem("deviceId");

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
  }

  return deviceId;
}

export const getDeviceInfo = async () => {
  const ua = navigator.userAgent;
  const uaData = navigator.userAgentData;

  let platform = "Unknown";
  let browser = "Unknown";
  let deviceType = "Desktop";

  // Modern browsers (Chrome, Edge)
  if (uaData) {
    platform = uaData.platform || "Unknown";

    const brands = uaData.brands || [];

    // ✅ Remove fake brands
    const filtered = brands
      .map(b => b.brand)
      .filter(
        name =>
          !name.toLowerCase().includes("not") &&
          !name.toLowerCase().includes("brand")
      );

    // ✅ Pick best browser name
    if (filtered.includes("Google Chrome")) browser = "Chrome";
    else if (filtered.includes("Microsoft Edge")) browser = "Edge";
    else if (filtered.includes("Chromium")) browser = "Chromium";
    else browser = filtered[0] || "Unknown";

    deviceType = uaData.mobile ? "Mobile" : "Desktop";
  }
  else {
    // Fallback for Safari / older browsers
    if (/Android/i.test(ua)) platform = "Android";
    else if (/iPhone|iPad/i.test(ua)) platform = "iOS";
    else if (/Windows/i.test(ua)) platform = "Windows";
    else if (/Mac/i.test(ua)) platform = "MacOS";

    if (/Chrome/i.test(ua)) browser = "Chrome";
    else if (/Safari/i.test(ua)) browser = "Safari";
    else if (/Firefox/i.test(ua)) browser = "Firefox";
    else if (/Edg/i.test(ua)) browser = "Edge";

    deviceType = /Mobi|Android/i.test(ua) ? "Mobile" : "Desktop";
  }

  return { platform, browser, deviceType };
};

export const buildSystemName = (info) => {
  return `${info.platform} · ${info.browser} · ${info.deviceType}`;
};

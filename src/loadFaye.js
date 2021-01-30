export const loadFaye = (cb) => {
  const existingScript = document.getElementById("scriptId");

  if (!existingScript) {
    const script = document.createElement("script");
    script.src = "http://house.chat:8080/signal/client.js"; // URL for the third-party library being loaded.
    script.id = "faye"; // e.g., googleMaps or stripe
    document.body.appendChild(script);

    script.onload = () => {
      if (cb) cb();
    };
  }

  if (existingScript && cb) cb();
};

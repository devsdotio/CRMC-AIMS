"use client";

import { useEffect } from "react";

type SwaggerStandaloneProps = {
  specUrl: string;
};

declare global {
  interface Window {
    SwaggerUIBundle?: (options: Record<string, unknown>) => unknown;
  }
}

export default function SwaggerStandalone({ specUrl }: SwaggerStandaloneProps) {
  useEffect(() => {
    const styleId = "swagger-ui-style";
    const scriptId = "swagger-ui-script";

    const mountSwagger = () => {
      if (!window.SwaggerUIBundle) {
        return;
      }

      window.SwaggerUIBundle({
        dom_id: "#swagger-ui",
        url: specUrl,
        deepLinking: true,
        docExpansion: "list",
        persistAuthorization: true,
      });
    };

    if (!document.getElementById(styleId)) {
      const link = document.createElement("link");
      link.id = styleId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css";
      document.head.appendChild(link);
    }

    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existingScript) {
      if (window.SwaggerUIBundle) {
        mountSwagger();
      } else {
        existingScript.addEventListener("load", mountSwagger, { once: true });
      }

      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js";
    script.async = true;
    script.addEventListener("load", mountSwagger, { once: true });
    document.body.appendChild(script);
  }, [specUrl]);

  return <div id="swagger-ui" className="min-h-screen w-full" />;
}

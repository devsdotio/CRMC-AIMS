import { createSwaggerSpec } from "next-swagger-doc";

export function getApiDocs() {
  return createSwaggerSpec({
    apiFolder: "src/app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "CRMC-AIMS",
        version: "1.0.0",
        description:
          "API for tracking coded assets and consumables in the CRMC custodian workflow.",
      },
      tags: [
        { name: "System", description: "System and health endpoints" },
        { name: "Assets", description: "Coded asset operations" },
        { name: "Consumables", description: "Consumable stock operations" },
        { name: "Requests", description: "Borrow and release requests" },
        { name: "Dashboard", description: "Admin dashboard data" },
      ],
    },
  });
}

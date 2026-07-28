"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

type ReactSwaggerProps = {
  spec: Record<string, unknown>;
};

export default function ReactSwagger({ spec }: ReactSwaggerProps) {
  return <SwaggerUI spec={spec} />;
}

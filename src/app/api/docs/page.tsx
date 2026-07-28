import { getApiDocs } from "@/lib/swagger";
import ReactSwagger from "./react-swagger";

export const dynamic = "force-dynamic";

export default function ApiDocsPage() {
  const spec = getApiDocs();

  return <ReactSwagger spec={spec} />;
}

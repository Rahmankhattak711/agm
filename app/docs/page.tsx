import ReactUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default async function ApiDocsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <ReactUI url="/api/doc" />
    </div>
  );
}

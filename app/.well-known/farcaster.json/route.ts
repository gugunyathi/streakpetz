import { withValidManifest } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "../../../minikit.config";

export async function GET() {
  const validManifest = withValidManifest(minikitConfig);
  
  // Add baseBuilder section if it exists in config
  if (minikitConfig.baseBuilder) {
    return Response.json({
      ...validManifest,
      baseBuilder: minikitConfig.baseBuilder
    });
  }
  
  return Response.json(validManifest);
}

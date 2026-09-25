import { eveChannel } from "eve/channels/eve";
import { localDev, none, vercelOidc } from "eve/channels/auth";

/**
 * Route auth for /eve/v1/*. The course platform is public and has no login, so
 * anonymous browser traffic is admitted explicitly with none(). Sessions are
 * still bounded by the limits in agent.ts. Put a real AuthFn ahead of none()
 * when the platform gets accounts.
 */
export default eveChannel({
  auth: [vercelOidc(), localDev(), none()],
  audience: "public",
});

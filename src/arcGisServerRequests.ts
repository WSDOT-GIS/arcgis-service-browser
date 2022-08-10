import { IServerInfo, IService } from "./interfaces";
import { getServerRoot } from "./urlUtils";

/**
 * Provides information about a map server URL
 * @param url ArcGIS server, folder, service, or layer URL.
 */
export async function getServerInfo(url: string): Promise<IServerInfo> {
  const serverResponse = await fetch(url + "?f=json");
  const serverInfoJson = await serverResponse.text();
  const root = getServerRoot(url);

  function reviver(key: string, value: unknown) {
    // Split comma-separated lists into arrays.
    if (
      /^(supported\w+Format\w*)|(Keywords)|(capabilities)$/i.test(key) &&
      typeof value === "string"
    ) {
      return value ? value.split(/[,\s]+/g) : "";
    }
    if (key === "folders") {
      const folderNames = value as string[];
      return folderNames.map((folderName) => ({
        name: folderName,
        url: `${root}/${folderName}`,
      }));
    }
    if (key === "services") {
      const services = value as IService[];
      return services.map((svc) => ({
        name: svc.name,
        url: `${root}/${svc.name}/${svc.type}`,
      }));
    }
    if (
      key === "timeExtent" ||
      // property name ends with "Date" and value is an integer.
      (/Date/.test(key) && typeof value === "number" && value % 1 === 0)
    ) {
      const timeInstants = value as number[];
      return timeInstants.map((ti) => new Date(ti).toISOString());
    }
    return value;
  }

  const serverInfo = JSON.parse(serverInfoJson, reviver);
  return serverInfo;
}

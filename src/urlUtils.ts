import { UnexpectedUrlFormatError } from "./UnexpectedUrlFormatError";

/**
 * Gets the value of the "url" search parameter from location.search.
 * @returns Returns the "url" value if present, null otherwise.
 */
export function getUrlSearchParam() {
  const urlSearch = new URLSearchParams(location.search);
  const url = urlSearch.get("url");
  return url;
}

/**
 * Extracts the server root URL.
 * @param url Server, service, layer, or other server resource URL
 */
export function getServerRoot(url: string = getUrlSearchParam()!) {
  const re = /^.+\/arcgis\/rest(\/services)?/;
  const match = url.match(re);
  if (!match) {
    throw new UnexpectedUrlFormatError(url, re);
  }
  // Add the "services" portion if missing.
  if (!match[1]) {
    // return new URL("services", match[0]).toString();
    return `${match[0]}/services`;
  }
  return match[0];
}

/**
 * Extracts the (Map, Feature, GP, etc.) service URL.
 * @param url
 */
export function getServiceUrl(url: string = getUrlSearchParam()!) {
  const re = /^.+\/arcgis\/rest\/services(?:\/\w+){1,2}\/(?:\w+Server)/i;
  const match = url.match(re);
  if (!match) {
    throw new UnexpectedUrlFormatError(url, re);
  }
  return match[0];
}

/**
 * Converts an ArcGIS Server URL into an application URL with its "url"
 * search parameter set to the ArcGIS Server URL.
 * @param arcGisUrl An ArcGIS Server URL (e.g., map service, folder, server root)
 * @param appUrl Application URL. defaults to location.href.
 */
export function wrapUrl(arcGisUrl: string, appUrl: string = location.href) {
  const url = new URL(appUrl);
  url.searchParams.set("url", arcGisUrl);
  return url.toString();
}

/**
 * When a URL is parsed the URLs for its parent's are returned.
 */
export interface IParsedUrls {
  /**
   * E.g., https://www.example.com/arcgis/rest/services
   */
  root: string;
  /**
   * E.g., https://www.example.com/arcgis/rest/services/MyFolder
   */
  folder: string | null;
  /**
   * E.g., https://www.example.com/arcgis/rest/services/MyFolder/MyService/MapServer
   * E.g., https://www.example.com/arcgis/rest/services/MyService/MapServer
   */
  service: string | null;
  /**
   * E.g., https://www.example.com/arcgis/rest/services/MyFolder/MyService/MapServer/0
   * E.g., https://www.example.com/arcgis/rest/services/MyService/MapServer/0
   */
  layer: string | null;
  /**
   * E.g., https://www.example.com/arcgis/rest/services/MyFolder/MyServiceGPServer/MyToolName
   * E.g., https://www.example.com/arcgis/rest/services/MyService/GPServer/MyToolName
   */
  tool: string | null;
}

/**
 * Gets the parent resources' URLs for a given ArcGIS Server URL.
 * @param url ArcGIS Server URL.
 * @returns Returns server "root" URL, and if available: "folder", "service", and "layer" URLs.
 */
export function getServiceUrlParts(
  url: string = getUrlSearchParam()!
): IParsedUrls | null {
  if (!url) {
    return null;
  }
  /*
  /(^.+\/arcgis\/rest\/services)  # 1. Server root
  (?:
    (?:\/)
    (?:(\w+)\/)?                  # 2. Folder name (may or may not be present)
    (\w+)
    \/
    (\w+Server)                   # 3. The type of service (MapServer, FeatureServer, etc)
    (?:
      \/(\d+)                     # 4. Layer number
    )?
  )?/
  */
  const svcUrlRe =
    /(^.+\/arcgis\/rest\/services)(?:(?:\/)(?:(\w+)\/)?(\w+)\/(\w+Server)(?:\/(\d+))?)?/;
  const gpSvcUrlRe =
    /(^.+\/arcgis\/rest\/services)(?:(?:\/)(?:(\w+)\/)?(\w+)\/(\w+Server)(?:\/([^/]+))?)?/;

  const match = url.match(svcUrlRe);
  if (match) {
    const [, rootUrl, folder, serviceName, serviceType, layerId] = match;

    const service = serviceName
      ? `${rootUrl}/${
          folder ? [folder, serviceName].join("/") : serviceName
        }/${serviceType}`
      : null;

    return {
      root: rootUrl,
      folder: folder ? `${rootUrl}/${folder}` : null,
      service,
      layer: service && layerId ? `${service}/${layerId}` : null,
      tool: null,
    };
  }

  const gpMatch = url.match(gpSvcUrlRe);
  if (gpMatch) {
    const [, rootUrl, folder, serviceName, serviceType, toolName] = gpMatch;

    const service = serviceName
      ? `${rootUrl}/${
          folder ? [folder, serviceName].join("/") : serviceName
        }/${serviceType}`
      : null;

    return {
      root: rootUrl,
      folder: folder ? `${rootUrl}/${folder}` : null,
      service,
      layer: null,
      tool: service && toolName ? `${service}/${toolName}` : null,
    };
  }

  // Possibly might be missing the "services" part. Try that before throwing exception.
  const serverRootUrl = getServerRoot();
  if (!serverRootUrl) {
    throw new UnexpectedUrlFormatError(url, svcUrlRe);
  }
  return {
    root: serverRootUrl,
    folder: null,
    service: null,
    layer: null,
    tool: null,
  };
}

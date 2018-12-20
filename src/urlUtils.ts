export class UnexpectedUrlFormatError extends Error {
  constructor(public url: string, public expectedFormat: RegExp) {
    super(`Unexpected URL format. ${url} does not match ${expectedFormat}`);
  }
}

function getUrlSearchParam() {
  const urlSearch = new URLSearchParams(location.search);
  const url = urlSearch.get("url");
  return url;
}

/**
 * Gets the server root URL
 * @param url Server, service, layer, or other server resource URL
 */
export function getServerRoot(url: string = getUrlSearchParam()!) {
  const re = /^.+\/arcgis\/rest(\/services)/;
  const match = url.match(re);
  if (!match) {
    throw new UnexpectedUrlFormatError(url, re);
  }
  // Add the "services" portion if missing.
  if (match.length === 1) {
    return new URL("services", match[0]).toString();
  }
  return match[0];
}

export function getServiceUrl(url: string = getUrlSearchParam()!) {
  const re = /^.+\/arcgis\/rest\/services(?:\/\w+){1,2}\/(?:\w+Server)/i;
  const match = url.match(re);
  if (!match) {
    throw new UnexpectedUrlFormatError(url, re);
  }
  return match[0];
}

export interface IParsedUrls {
  root: string;
  folder: string | null;
  service: string | null;
  layer: string | null;
}

export function getServiceUrlParts(
  url: string = getUrlSearchParam()!
): IParsedUrls | null {
  if (!url) {
    return null;
  }
  const svcUrlRe = /(^.+\/arcgis\/rest\/services)(?:(?:\/)(?:(\w+)\/)?(\w+)\/(\w+Server)(?:\/(\d+))?)?/;

  const match = url.match(svcUrlRe);
  if (!match) {
    throw new UnexpectedUrlFormatError(url, svcUrlRe);
  }
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
    layer: service && layerId ? `${service}/${layerId}` : null
  };
}

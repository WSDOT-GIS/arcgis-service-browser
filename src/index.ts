import { getServerRoot, getServiceUrl, getServiceUrlParts } from "./urlUtils";

function arrayToTable(objects: any[], propertyName?: string) {
  const table = document.createElement("table");
  if (propertyName) {
    table.classList.add(`property--${propertyName}`);
  }
  const head = table.createTHead();
  const hRow = head.insertRow();

  const body = table.createTBody();

  // Get list of all field names.
  const fieldNames = new Set<string>();
  for (const obj of objects) {
    for (const propName in obj) {
      if (obj.hasOwnProperty(propName)) {
        fieldNames.add(propName);
      }
    }
  }

  // Add a table heading cell for each property.
  fieldNames.forEach(fn => {
    const th = document.createElement("th");
    th.innerText = fn;
    hRow.appendChild(th);
  });

  objects.forEach(o => {
    const bRow = body.insertRow();
    fieldNames.forEach(fn => {
      const value = o[fn];
      const cell = bRow.insertCell();
      if (fn === "name" && o.hasOwnProperty("id")) {
        const a = document.createElement("a");
        const svcUrl = getServiceUrl();
        const hrefUrl = new URL(location.href);
        hrefUrl.searchParams.set("url", `${svcUrl}/${o.id}`);
        a.href = hrefUrl.toString();
        a.innerText = value;
        cell.appendChild(a);
      } else if (fn === "domain") {
        const domElement = toDefinitionList(value);
        if (domElement) {
          cell.appendChild(domElement);
        }
      } else {
        cell.innerText = value;
      }
    });
  });

  // Return the table only if the body is not empty.
  return body.childElementCount ? table : null;
}

function arrayToElement(arr: any[], propertyName?: string) {
  if (
    propertyName &&
    /^(fields)|(layers)|(tables)|(codedValues)$/.test(propertyName)
  ) {
    return arrayToTable(arr, propertyName);
  }

  if (propertyName && /^(folders)|(services)/.test(propertyName)) {
    const linkList = document.createElement("ul");
    arr.forEach((linkItem: ILinkInfo) => {
      const a = document.createElement("a");
      const urlParams = new URLSearchParams({ url: linkItem.url });
      a.href = new URL("?" + urlParams.toString(), location.href).toString();
      a.textContent = linkItem.name;
      const li = document.createElement("li");
      li.appendChild(a);
      linkList.appendChild(li);
    });
    return linkList;
  }

  if (propertyName === "color") {
    arr[3] = arr[3] / 255;
    const content = `rgba(${arr.join(",")})`;
    const span = document.createElement("span");
    span.style.color = content;
    span.innerText = content;
    return span;
  }

  const list = document.createElement("ul");
  if (propertyName) {
    list.classList.add(`property--${propertyName}`);
  }

  arr
    .map(item => {
      const element = toDefinitionList(item);
      if (element) {
        const li = document.createElement("li");
        li.appendChild(element);
        return li;
      }
    })
    .filter(li => li !== undefined)
    .forEach(li => list.appendChild(li!));
  return list;
}

/**
 * Converts an object into a DOM node.
 * @param o any type of JavaScript object or value.
 * @returns if the input is a standard object, returned value will be an HTMLDListElement.
 * For other types, such as string, number, boolean, or Date, a Text element will be returned
 */
function toDefinitionList(o: any, propertyName?: string) {
  if (o == null) {
    return document.createTextNode(o === null ? "null" : "undefined");
  }

  if (Array.isArray(o)) {
    return arrayToElement(o, propertyName);
  }

  if (typeof o === "boolean") {
    return document.createTextNode(o ? "true" : "false");
  }

  if (/^(string)|(number)$/.test(typeof o) || o instanceof Date) {
    return document.createTextNode(`${o}`);
  }

  const dl = document.createElement("dl");

  for (const key in o) {
    if (o.hasOwnProperty(key)) {
      const value = o[key];
      const dt = document.createElement("dt");
      dt.innerText = key;
      const dd = document.createElement("dd");
      const content = toDefinitionList(value, key);
      if (content) {
        dd.appendChild(content);
      }

      [dt, dd].forEach(element => dl.appendChild(element));
    }
  }

  return dl;
}

/**
 * Provides information about a map server URL
 * @param url ArcGIS server, folder, service, or layer URL.
 */
async function getServerInfo(url: string): Promise<IServerInfo> {
  const serverResponse = await fetch(url + "?f=json");
  const serverInfoJson = await serverResponse.text();
  const root = getServerRoot(url);

  const reviver = (key: any, value: any) => {
    if (
      /^(supported\w+Format\w*)|(Keywords)|(capabilities)$/i.test(key) &&
      typeof value === "string"
    ) {
      return value.split(/[,\s]+/g);
    }
    if (key === "folders") {
      const folderNames = value as string[];
      return folderNames.map(folderName => ({
        name: folderName,
        url: `${root}/${folderName}`
      }));
    }
    if (key === "services") {
      const services = value as IService[];
      return services.map(svc => ({
        name: svc.name,
        url: `${root}/${svc.name}/${svc.type}`
      }));
    }
    if (key === "timeExtent") {
      const timeInstants = value as number[];
      return timeInstants.map(ti => new Date(ti).toISOString());
    }
    return value;
  };

  const serverInfo = JSON.parse(serverInfoJson, reviver);
  return serverInfo;
}

/**
 * Creates the main DOM element that will be added to the page body.
 * @param serverInfo parsed JSON information returned from a server, folder, service, or layer URL.
 * @returns A Document fragment to be appended to document.body.
 */
function createDom(serverInfo: IServerInfo) {
  const frag = document.createDocumentFragment();

  const dl = document.createElement("dl");

  for (const propName in serverInfo) {
    if (serverInfo.hasOwnProperty(propName)) {
      const value = serverInfo[propName];
      const dt = document.createElement("dt");
      dt.innerText = propName;

      const dd = document.createElement("dd");
      const element = toDefinitionList(value, propName);
      dl.appendChild(dt);
      if (element) {
        dd.appendChild(element);
      }
      dl.appendChild(dd);
    }
  }
  frag.append(dl);

  return frag;
}

function createBreadcrumbs() {
  const urlParts = getServiceUrlParts();
  if (urlParts) {
    const breadCrumbs = document.createElement("ol");
    breadCrumbs.classList.add("breadcrumbs");
    for (const partName in urlParts) {
      if (urlParts.hasOwnProperty(partName)) {
        const url = (urlParts as any)[partName];
        if (!url) {
          continue;
        }
        const li = document.createElement("li");
        li.classList.add("breadcrumbs__item");
        const a = document.createElement("a");
        a.classList.add("breadcrumbs__item__anchor");
        const pageUrl = new URL(location.href);
        pageUrl.searchParams.set("url", url);
        a.href = pageUrl.toString();
        a.innerText = partName;
        li.appendChild(a);
        breadCrumbs.appendChild(li);
      }
    }
    document.body.appendChild(breadCrumbs);
  }
}

createBreadcrumbs();

(async () => {
  const urlParams = new URLSearchParams(location.search);

  const serverUrl = urlParams.get("url");

  if (!serverUrl) {
    return;
  }

  // Put URL in box:
  const input = document.querySelector<HTMLInputElement>(
    "form > input[name='url']"
  );
  if (input) {
    input.value = serverUrl;
  }

  /**
   * Tests to see if the URL is a service or layer URL.
   */
  const serviceUrlRe = /\/\w+Server(\/\d+)?\/?$/i;

  if (serviceUrlRe.test(serverUrl)) {
    const serverInfo = await getServerInfo(serverUrl);
    const dl = toDefinitionList(serverInfo);
    if (dl) {
      document.body.appendChild(dl);
    }
  } else {
    const serverInfo = await getServerInfo(serverUrl);
    const frag = createDom(serverInfo);
    document.body.appendChild(frag);
  }
})();

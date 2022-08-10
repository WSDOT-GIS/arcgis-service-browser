import { Color } from "@esri/arcgis-rest-common-types";
import { load } from "webfontloader";
import { getServerInfo } from "./arcGisServerRequests";
import { colorToDom } from "./colorUtils";
import { createDatumXFormTable } from "./datumUtils";
import { ILinkInfo } from "./interfaces";
import { createLayerList } from "./Layer";
import { createLegendDom, createLegendList, ILegendResponse } from "./legend";
import { symbolToDom } from "./symbols";
import {
  getServiceUrl,
  getServiceUrlParts,
  getUrlSearchParam,
  wrapUrl,
} from "./urlUtils";

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
  fieldNames.forEach((fn) => {
    const th = document.createElement("th");
    th.innerText = fn;
    hRow.appendChild(th);
  });

  objects.forEach((o) => {
    const bRow = body.insertRow();
    fieldNames.forEach((fn) => {
      const value = o[fn];
      const cell = bRow.insertCell();
      if (fn === "name" && Object.prototype.hasOwnProperty.call(o, "id")) {
        const a = document.createElement("a");
        const svcUrl = getServiceUrl();
        const hrefUrl = new URL(location.href);
        hrefUrl.searchParams.set("url", `${svcUrl}/${o.id}`);
        a.href = hrefUrl.toString();
        a.innerText = value;
        cell.appendChild(a);
      } else if (fn === "domain") {
        const domElement = toDomElement(value);
        if (domElement) {
          cell.appendChild(domElement);
        }
      } else if (/^(string)|(number)/.test(typeof value)) {
        cell.innerText = value;
      } else {
        const cellContentElement = toDomElement(value, fn);
        if (cellContentElement) {
          cell.appendChild(cellContentElement);
        }
      }
    });
  });

  // Return the table only if the body is not empty.
  return body.childElementCount ? table : null;
}

function arrayToElement(arr: any[], propertyName?: string) {
  const currentUrl = getUrlSearchParam();
  const isLayersUrl = /\/layers\/?$/.test(currentUrl!);
  if (propertyName) {
    if (propertyName === "layers" && !isLayersUrl) {
      return createLayerList(arr);
    }
    if (
      /^(fields)|(layers)|(tables)|(codedValues)|(lods)|(indexes)|(relationships)|(((symbol)|(sub))Layers)|((sub)?types)$/.test(
        propertyName
      )
    ) {
      return arrayToTable(arr, propertyName);
    }

    if (/^(folders)|(services)/.test(propertyName)) {
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

    if (propertyName === "legend") {
      return createLegendList(arr);
    }

    if (propertyName === "tasks") {
      const serviceUrl = getServiceUrl();
      const links = arr.map((taskName) => {
        const a = document.createElement("a");
        a.href = wrapUrl(`${serviceUrl}/${taskName}`);
        a.textContent = taskName;
        const li = document.createElement("li");
        li.appendChild(a);
        return li;
      });
      const taskList = document.createElement("ul");
      links.forEach((link) => taskList.appendChild(link));
      return taskList;
    }

    if (propertyName === "color") {
      return colorToDom(arr as Color);
    }
  }

  const list = document.createElement("ul");
  if (propertyName) {
    list.classList.add(`property--${propertyName}`);
  }

  arr
    .map((item) => {
      const element = toDomElement(item);
      if (element) {
        const li = document.createElement("li");
        li.appendChild(element);
        return li;
      }
    })
    .filter((li) => li !== undefined)
    .forEach((li) => list.appendChild(li!));
  return list;
}

/**
 * Converts an object into a DOM node.
 * @param o any type of JavaScript object or value.
 * @returns if the input is a standard object, returned value will be an HTMLDListElement.
 * For other types, such as string, number, boolean, or Date, a Text element will be returned
 */
function toDomElement(o: any, propertyName?: string) {
  if (o == null) {
    return document.createTextNode(o === null ? "null" : "undefined");
  }

  if (o instanceof Element) {
    return o;
  }

  if (propertyName) {
    // if propertyName ends with "url" and is not a hex number...
    if (o && /Url$/i.test(propertyName) && !/^[0-9a-f]+$/i.test(o)) {
      const a = document.createElement("a");
      a.textContent = o;
      a.href = o;
      return a;
    }
    if (/^(?:latest)?[Ww]kid$/.test(propertyName)) {
      const a = document.createElement("a");
      a.innerText = o;
      a.href = `https://epsg.io/${o}`;
      a.target = "epsg";
      return a;
    }
    if (propertyName === "datumTransformations") {
      return createDatumXFormTable(o);
    }
  }

  // Try symbol
  const symbolImg = symbolToDom(o);
  if (symbolImg) {
    return symbolImg;
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
      const content = toDomElement(value, key);
      if (content) {
        dd.appendChild(content);
      }

      [dt, dd].forEach((element) => dl.appendChild(element));
    }
  }

  return dl;
}

/**
 * Creates links to parent resources and appends this list to document body.
 */
function createBreadcrumbs() {
  const urlParts = getServiceUrlParts();
  if (urlParts) {
    const breadcrumbs = document.createElement("nav");
    const list = document.createElement("ol");
    breadcrumbs.appendChild(list);
    breadcrumbs.classList.add("breadcrumbs");
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
        list.appendChild(li);
      }
    }
    const header = document.body.querySelector("header");
    header!.appendChild(breadcrumbs);
  }
}

createBreadcrumbs();

function createLinksList(url: string) {
  const { service, tool: toolName, layer } = getServiceUrlParts(url)!;

  // Exit if deeper than service level.
  if (!service || toolName || layer) {
    return;
  }

  // Exit if GP service.
  if (/GPServer/.test(service)) {
    return;
  }

  function createListItem(a: HTMLAnchorElement) {
    const li = document.createElement("li");
    li.appendChild(a);
    list.appendChild(li);
  }

  function createAnchor(s: string, wrap?: boolean) {
    const a = document.createElement("a");
    a.textContent = s;
    let href = `${service}/${s}`;
    if (wrap) {
      href = wrapUrl(href);
    } else {
      a.target = "_blank";
    }
    a.href = href;
    return a;
  }

  let links = ["legend", "layers", "info/iteminfo"].map((s) =>
    createAnchor(s, true)
  );
  const list = document.createElement("ul");
  list.classList.add("layer-resource-link-list");
  links.forEach(createListItem);
  // These endpoints don't support JSON, so will link directly
  // instead of using wrapped app URL.
  links = ["metadata", "thumbnail"].map((s) =>
    createAnchor(`info/${s}`, false)
  );
  links.forEach(createListItem);

  return list;
}

load({
  google: {
    families: ["Noto Sans"],
  },
});

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

  const legendUrlRe = /\/legend\b\/?/;

  const mainSection = document.querySelector("#main");

  if (!mainSection) {
    console.warn("couldn't find main section");
  }

  const serverInfo = await getServerInfo(serverUrl);

  if (legendUrlRe.test(serverUrl)) {
    const legendDom = createLegendDom(serverInfo as ILegendResponse);
    mainSection!.appendChild(legendDom);
    return;
  }

  const linksList = createLinksList(serverUrl);
  if (linksList) {
    mainSection!.appendChild(linksList);
  }

  const contentElement = toDomElement(serverInfo);
  if (contentElement) {
    mainSection!.appendChild(contentElement);
  }
})();

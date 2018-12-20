interface IService {
  name: string;
  type: string;
}

interface ILinkInfo {
  name: string;
  url: string;
}

interface IServerInfo {
  [key: string]: any;
  currentVersion: number;
  folders: ILinkInfo[];
  services: ILinkInfo[];
}

function createLink(linkInfo: ILinkInfo) {
  const a = document.createElement("a");
  const destUrl = new URL(location.href);
  destUrl.searchParams.set("url", linkInfo.url);
  a.href = destUrl.toString();
  a.innerText = linkInfo.name;
  return a;
}

function createLinkList(linkInfos: ILinkInfo[], listType: "ul" | "ol" = "ul") {
  const list = document.createElement(listType);
  const listItems = linkInfos.map(linkInfo => {
    const li = document.createElement("li");
    const a = createLink(linkInfo);
    li.appendChild(a);
    return li;
  });
  for (const li of listItems) {
    list.appendChild(li);
  }
  return list;
}

function toDefinitionList(o: any) {
  if (o == null) {
    return document.createTextNode(o === null ? "null" : "undefined");
  }

  if (/^(string)|(number)|(boolean)$/.test(typeof o) || o instanceof Date) {
    return document.createTextNode(`${o}`);
  }

  const dl = document.createElement("dl");

  for (const key in o) {
    if (o.hasOwnProperty(key)) {
      const value = o[key];
      const dt = document.createElement("dt");
      dt.innerText = key;
      const dd = document.createElement("dd");
      dd.appendChild(toDefinitionList(value));

      [dt, dd].forEach(element => dl.appendChild(element));
    }
  }

  return dl;
}

async function getServerInfo(url: string): Promise<IServerInfo> {
  const serverResponse = await fetch(url + "?f=json");
  const serverInfoJson = await serverResponse.text();
  const serverRootRe = /^.+\/arcgis\/rest\/services\/?/i;

  function toLinkInfo(key: any, value: any) {
    const rootMatch = url.match(serverRootRe);
    const root = rootMatch ? rootMatch[0] : url;
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
    return value;
  }

  const serverInfo = JSON.parse(serverInfoJson, toLinkInfo);
  return serverInfo;
}

function createDom(serverInfo: IServerInfo) {
  const frag = document.createDocumentFragment();

  const dl = document.createElement("dl");

  frag.append(dl);

  let dt = document.createElement("dt");
  dt.innerText = "Current Version";
  let dd = document.createElement("dd");
  dd.innerText = serverInfo.currentVersion as any;

  dl.appendChild(dt);
  dl.appendChild(dd);

  // Add folder list
  const folderList = createLinkList(serverInfo.folders);
  dt = document.createElement("dt");
  dd = document.createElement("dd");
  dt.innerText = "Folders";
  dt.appendChild(folderList);

  dl.appendChild(dt);
  dl.appendChild(dd);

  // Add service list
  const serviceList = createLinkList(serverInfo.services);
  dt = document.createElement("dt");
  dd = document.createElement("dd");
  dt.innerText = "Services";
  dt.appendChild(serviceList);

  dl.appendChild(dt);
  dl.appendChild(dd);

  return frag;
}

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

  const serviceUrlRe = /\/\w+Server(\/\d+)?\/?$/i;

  if (serviceUrlRe.test(serverUrl)) {
    const serverInfo = await getServerInfo(serverUrl);
    const dl = toDefinitionList(serverInfo);
    document.body.appendChild(dl);
  } else {
    const serverInfo = await getServerInfo(serverUrl);
    const frag = createDom(serverInfo);
    document.body.appendChild(frag);
  }
})();

import { getServiceUrl } from "./urlUtils";

export interface ILegendLayer {
  layerId: number;
  layerName: string;
  layerType: string;
  minScale: number;
  maxScale: number;
  legend: ILegendSymbol[];
}

export interface ILegendResponse {
  layers: ILegendLayer[];
}

export interface ILegendSymbol {
  label: string | null;
  url: string;
  imageData: string;
  contentType: string;
  height: number;
  width: number;
}

function createImg(legend: ILegendSymbol) {
  const url = `data:${legend.contentType};base64,${legend.imageData}`;
  const img = document.createElement("img");
  img.src = url;
  img.alt = legend.label || "unnamed legend symbol";
  img.width = legend.width;
  img.height = legend.height;
  return img;
}

export function createLegendList(legendSymbols: ILegendSymbol[]) {
  // If there is only a single, unlabeld symbol, return just an img instead of
  // a definition list.
  if (legendSymbols.length === 1 && !legendSymbols[0].label) {
    return createImg(legendSymbols[0]);
  }
  const dl = document.createElement("dl");
  for (const s of legendSymbols) {
    const img = createImg(s);
    const dt = document.createElement("dt");
    dt.textContent = s.label;
    const dd = document.createElement("dd");
    dd.appendChild(img);
    [dt, dd].forEach((element) => dl.appendChild(element));
  }
  return dl;
}

export function createLegendDom(legendResponse: ILegendResponse) {
  const frag = document.createDocumentFragment();
  const { layers } = legendResponse;

  for (const layer of layers) {
    const layerHeading = document.createElement("h2");
    layerHeading.textContent = `${layer.layerId}. ${layer.layerName} (${layer.layerType})`;
    frag.appendChild(layerHeading);
    if (layer.minScale || layer.maxScale) {
      const scaleP = document.createElement("p");
      scaleP.textContent = `Scale: ${layer.minScale} to ${layer.maxScale}`;
      frag.appendChild(scaleP);
    }
    if (layer.legend) {
      frag.appendChild(createLegendList(layer.legend));
    }
  }

  return frag;
}

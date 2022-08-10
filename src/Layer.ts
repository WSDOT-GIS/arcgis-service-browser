import { getServiceUrl, wrapUrl } from "./urlUtils";

export interface IHasId {
  id: number;
}

export interface IMapServiceResponseLayerCommon extends IHasId {
  name: string;
  defaultVisibility: boolean;
  subLayerIds: number[] | null;
  minScale: number;
  maxScale: number;
}

export interface IMapServiceResponseLayer
  extends IMapServiceResponseLayerCommon {
  parentLayerId: number;
}

export interface IMapServiceLayersResponseSubLayer extends IHasId {
  name: string;
}

export interface IMapServiceLayersResponseLayer
  extends IMapServiceResponseLayerCommon {
  parentLayer: IMapServiceLayersResponseSubLayer;
}

export class MapServiceResponseLayer {
  public id: number;
  public name: string;
  public parentLayerId: number | null = null;
  public defaultVisibility: boolean;
  public subLayerIds: number[] | null = null;
  public minScale: number;
  public maxScale: number;
  public subLayers: MapServiceResponseLayer[] | null;
  public parentLayer: MapServiceResponseLayer | null | undefined;
  public get url() {
    const svcUrl = getServiceUrl();
    if (svcUrl) {
      return `${svcUrl}/${this.id}`;
    }
  }
  constructor(
    layer: IMapServiceResponseLayer | IMapServiceLayersResponseLayer
  ) {
    this.id = layer.id;
    this.name = layer.name;
    // this.parentLayerId = (layer as IMapServiceResponseLayer).parentLayerId || (layer as IMapServiceLayersResponseLayer).parent
    if (Object.prototype.hasOwnProperty.call(layer, "parentLayerId")) {
      this.parentLayerId = (layer as IMapServiceResponseLayer).parentLayerId;
    } else if (Object.prototype.hasOwnProperty.call(layer, "parentLayer")) {
      const l = layer as IMapServiceLayersResponseLayer;
      this.parentLayerId = l.parentLayer ? l.parentLayer.id : -1;
    }
    this.defaultVisibility = layer.defaultVisibility;
    if (layer.subLayerIds) {
      if (typeof layer.subLayerIds[0] === "number") {
        this.subLayerIds = layer.subLayerIds as number[];
      } else {
        this.subLayerIds = (layer.subLayerIds as unknown[] as IHasId[]).map(
          (l) => l.id
        );
      }
    }
    this.minScale = layer.minScale;
    this.maxScale = layer.maxScale;

    this.subLayers = layer.subLayerIds
      ? new Array<MapServiceResponseLayer>()
      : null;
    // // Set to null if there is no parent layer, otherwise set to undefined
    // // so it can be defined later.
    // this.parentLayer = layer.parentLayerId === -1 ? null : undefined;
  }
}

function createLayerObjects(layerInfos: IMapServiceResponseLayer[]) {
  console.group("createLayerObjects");
  console.debug("layerInfos", layerInfos);
  // Create lookup for layers by layer's "id".
  const layerMap = new Map<number, MapServiceResponseLayer>();
  // Initialize an array that will only contain layers with no parent.
  const topLevelLayers = new Array<MapServiceResponseLayer>();
  const layers = new Array<MapServiceResponseLayer>();
  for (const lInfo of layerInfos) {
    // Create layer object.
    const layer = new MapServiceResponseLayer(lInfo);
    layers.push(layer);
    // Add to the Map.
    layerMap.set(layer.id, layer);
    // If layer has a parent, set the layer's parentLayer object.
    // Otherwise add it to the topLevelLayers array.
    if (
      lInfo.parentLayerId !== -1 ||
      (lInfo as unknown as IMapServiceLayersResponseLayer).parentLayer != null
    ) {
      layer.parentLayer = layerMap.get(layer.parentLayerId!);
    } else {
      layer.parentLayer = null;
      topLevelLayers.push(layer);
    }
  }

  // Now that all of the layer objects have been created,
  // for the layers that have sublayer IDs, create the layer's
  // sublayers property array.
  for (const l of layers) {
    if (l.subLayerIds) {
      l.subLayers = l.subLayerIds.map((id) => layerMap.get(id)!);
    }
  }
  console.groupEnd();

  return { layerMap, topLevelLayers };
}

type HTMLList = HTMLOListElement | HTMLUListElement;

function createListItem(layer: MapServiceResponseLayer, parentList?: HTMLList) {
  console.group("createListItem");
  console.debug("args", { layer, parentList });
  if (!layer) {
    throw TypeError("layer parameter cannot be null or undefined");
  }
  const svcUrl = getServiceUrl()!;
  const li = document.createElement("li");
  const a = document.createElement("a");
  li.appendChild(a);
  a.textContent = `${layer.name} (${layer.id})`;
  a.href = wrapUrl(`${svcUrl}/${layer.id}`);
  li.dataset.defaultVisibility = layer.defaultVisibility.toString();
  if (parentList) {
    parentList.appendChild(li);
  }
  if (layer.subLayers) {
    const subLayerList = document.createElement("ul");
    for (const sl of layer.subLayers) {
      if (!sl) {
        console.warn("current sublayer is null or undefined", sl);
        continue;
      }
      createListItem(sl, subLayerList);
    }
    li.appendChild(subLayerList);
  }
  console.groupEnd();
  return li;
}

export function createLayerList(layerInfos: IMapServiceResponseLayer[]) {
  console.group("createLayerList");
  const { topLevelLayers, layerMap } = createLayerObjects(layerInfos);
  console.debug("parsed", { topLevelLayers, layerMap });
  const layerList = document.createElement("ul");
  for (const layer of topLevelLayers) {
    createListItem(layer, layerList);
  }
  console.groupEnd();
  return layerList;
}

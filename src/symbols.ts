import {
  IPictureFillSymbol,
  IPictureMarkerSymbol,
  ISimpleFillSymbol,
  ISimpleLineSymbol,
  ISymbol,
  SimpleFillSymbolStyle,
  SimpleLineSymbolStyle,
  SimpleMarkerSymbolStyle,
} from "@esri/arcgis-rest-types";
import { isHexString, rgbaArrayToCssRgb } from "./colorUtils";
import { getServiceUrlParts } from "./urlUtils";

/**
 * A symbol "url" property consists of just a hexadecimal string. This function
 * creates a valid URL from that hex string by combining it with the layer URL.
 * @param imageUrlHex The hexadecimal string from the "url" property of a symbol object.
 * @param layerUrl The URL of the service layer. If omitted, function will attempt to autodetect using "url" search parameter.
 */
export function toSymbolUrl(imageUrlHex: string, layerUrl?: string) {
  // Ensure valid layer URL
  const parts = getServiceUrlParts(layerUrl);
  layerUrl = parts?.layer || undefined;

  const imageUrl = `${layerUrl}/images/${imageUrlHex}`;
  return imageUrl;
}

/**
 * Converts a picture marker symbol object into an img element.
 * @param pms A picture marker symbol object.
 */
export function pictureSymbolToImage(
  pms: IPictureMarkerSymbol | IPictureFillSymbol
) {
  let url: string | null = null;
  if (pms.imageData && pms.contentType) {
    url = `data:${pms.contentType};base64,${pms.imageData}`;
  } else if (isHexString(pms.url!)) {
    url = toSymbolUrl(pms.url!);
  }
  if (url) {
    const img = document.createElement("img");
    img.src = url;
    img.alt = "legend symbol";
    ["width", "height"].forEach((propName) => {
      const sValue = Object.prototype.hasOwnProperty.call(pms, propName)
        ? (pms as unknown as Record<string, string>)[propName]
        : null;
      if (sValue) {
        img.setAttribute(propName, sValue);
      }
    });
    const pfs = pms as IPictureFillSymbol;
    if (pfs.outline) {
      const { color, width } = pfs.outline;
      let style: string | undefined = pfs.outline.style;
      if (style) {
        style = style.replace(/^esriSLS/, "").toLowerCase();
        if (/null/.test(style)) {
          style = undefined;
        } else {
          img.style.borderStyle = style;
        }
      }

      if (color) {
        img.style.borderColor = rgbaArrayToCssRgb(color);
      }

      if (width !== undefined) {
        img.style.borderWidth = `${width}px`;
      }
    }
    return img;
  }
  return null;
}

interface ISize {
  width: string;
  height: string;
}

function trimPrefix(
  styleName:
    | SimpleFillSymbolStyle
    | SimpleLineSymbolStyle
    | SimpleMarkerSymbolStyle
) {
  if (!styleName) {
    return null;
  }
  if (/null$/i.test(styleName)) {
    return null;
  }
  const styleDesc = styleName.replace(/^esriS[A-Z]S/, "");
  const words = styleDesc.match(/[A-Z][a-z]+/g);
  if (!words) {
    return styleDesc;
  }
  return words.map((w) => w.toLowerCase()).join("-");
}

function applyOutlineStyle(element: HTMLElement, symbol?: ISimpleLineSymbol) {
  if (symbol) {
    const { style, color, width } = symbol;
    if (style) {
      const classStyle = trimPrefix(style);
      if (classStyle) {
        element.classList.add(`symbol-outline-style-${classStyle}`);
        element.style.borderStyle = classStyle;
      }
    }
    if (color) {
      element.style.borderColor = rgbaArrayToCssRgb(color);
    }
    if (width) {
      element.style.borderWidth = `${width}px`;
    }
  }
}

function sfsToDom(
  symbol: ISimpleFillSymbol,
  swatchSize: ISize = { width: "20px", height: "20px" }
) {
  const div = document.createElement("div");

  const { color, style } = symbol;

  if (style) {
    const fillStyle = trimPrefix(style);
    if (color) {
      div.style.backgroundColor = rgbaArrayToCssRgb(color);
    }
    if (fillStyle !== "solid") {
      div.textContent = style;
    } else {
      div.style.width = swatchSize.width;
      div.style.height = swatchSize.height;
    }
    div.classList.add(`fill-style--${style}`);
    // TODO: show the fill style using CSS instead of just writing the text in div.
  }

  applyOutlineStyle(div, symbol.outline);

  return div;
}

/**
 * Converts a symbol object to an img if possible.
 * @param symbolObject A symbol object.
 */
export function symbolToDom(symbolObject: ISymbol) {
  if (/^esriP[MF]S$/.test(symbolObject.type)) {
    return pictureSymbolToImage(symbolObject as IPictureMarkerSymbol);
  }
  // if (/^esriSFS$/.test(symbolObject.type)) {
  //   return sfsToDom(symbolObject as ISimpleFillSymbol);
  // }
  return null;
}

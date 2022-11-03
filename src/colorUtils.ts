import { Color } from "@esri/arcgis-rest-types";

export function isHexString(s: string) {
  if (!s) {
    return false;
  }
  return /^[0-9a-f]+$/i.test(s);
}

export function rgbToHex(rgb: number[]) {
  const hexValues = rgb.map((value) => value.toString(16));
  return `#${hexValues.join("")}`;
}

export function rgbaArrayToCssRgb(rgba: Color) {
  const [r, g, b] = rgba;
  let [, , , a] = rgba;
  a = a / 255;
  return `rgba(${[r, g, b, a].join(",")})`;
}

export function colorToDom(rgba: Color) {
  const [r, g, b] = rgba;
  let [, , , a] = rgba;
  a = a / 255;
  const input = document.createElement("input");
  input.type = "color";
  input.value = rgbToHex([r, g, b]);
  input.disabled = true;
  return input;
}

import type { Color } from "@esri/arcgis-rest-types";

export type RGB = [number, number, number];

/**
 * Determines if an input string is a hexadecimal string.
 * @param s - An input string.
 * @returns true if it is a hex string, false otherwise
 */
export function isHexString(s?: string): s is string {
  if (!s) {
    return false;
  }
  return /^[0-9a-f]+$/i.test(s);
}

export type HexString<Type extends string> = `#${Type}`;

/**
 * Converts an {@link RGB} or {@link Color} value to a hexadecimal string.
 * @param rgb - An array of RGB(A) values.
 * @returns A hex string prefixed with #.
 */
export function rgbToHex(rgb: RGB | Color): HexString<string> {
  // Convert all values in array to hexadecimal string representations.
  const hexValues = rgb.map((value) => value.toString(16));
  // Combine all the digits and prepend "#".
  return `#${hexValues.join("")}`;
}

/**
 * Converts a {@link Color} into an rgba CSS string.
 * @param rgba - Array of RGBA values.
 * @returns - CSS string rgba value.
 */
export function rgbaArrayToCssRgb(rgba: Color) {
  const [r, g, b] = rgba;
  let [, , , a] = rgba;
  a = a / 255;
  return `rgba(${[r, g, b, a].join(",")})`;
}

/**
 * Creates controls representing the input color.
 * @param rgba - An array of RGBA values.
 * @returns A document fragment containing two input controls:
 * One "color" and one "range" for alpha value.
 */
export function colorToDom(rgba: Color): DocumentFragment {
  // Color inputs do not support alpha.
  const [r, g, b] = rgba;
  const [, , , a] = rgba;
  // a = a / 255;
  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.value = rgbToHex([r, g, b]);
  colorInput.disabled = true;

  const alphaInput = document.createElement("input");
  alphaInput.type = "range";
  alphaInput.value = a.toString();
  alphaInput.min = `${0}`;
  alphaInput.max = `${255}`;
  alphaInput.disabled = true;

  const fragment = document.createDocumentFragment();
  fragment.append(colorInput, alphaInput);

  return fragment;
}

/**
 * Detects if the input object or value is an {@link RGB} or {@link Color} array.
 * @param rgba - Any object or value, which will be tested to see if it
 * is an {@link RGB} or {@link Color}.
 * @returns - True if the input value is a color array, false otherwise.
 */
export function isRgbOrRgbA(rgba: unknown): rgba is RGB | Color {
  if (!Array.isArray(rgba)) {
    return false;
  }

  if (rgba.length < 3 || rgba.length > 4) {
    return false;
  }

  for (const item of rgba) {
    if (typeof item !== "number") {
      return false;
    }
  }

  return true;
}

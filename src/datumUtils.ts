import { IDatumTransformation } from "./interfaces";

/**
 * Creates a table listing datum transformations.
 * @param dXforms Data transformation objects
 */
export function createDatumXFormTable(dXforms: IDatumTransformation[]) {
  const table = document.createElement("table");
  table.classList.add("property--datumTransformations");
  const headRow = table.createTHead().insertRow();
  const body = table.createTBody();

  const propNames = ["name", "transformForward", "wkid", "latestWkid"];

  function createLink(name: string, wkid: number, latestWkid?: number) {
    const a = document.createElement("a");
    a.innerText = name;
    a.target = "epsg";
    const url = `https://epsg.io/${latestWkid || wkid}`;
    a.href = url;
    return a;
  }

  ["id"].concat(propNames).forEach((s) => {
    const th = document.createElement("th");
    th.innerText = s;
    headRow.appendChild(th);
  });

  dXforms.forEach((dt, i) => {
    dt.geoTransforms.forEach((gt) => {
      const values = [i, gt.name, gt.transformForward, gt.wkid, gt.latestWkid];
      const row = body.insertRow();
      values.forEach((v, j) => {
        const cell = row.insertCell();
        if (j === 1) {
          cell.appendChild(createLink(gt.name, gt.wkid, gt.latestWkid));
        } else {
          cell.innerText = `${v}`;
        }
      });
    });
  });

  // Loop through the rows and merge the ID cells that are the same.
  const dtxIds = new Set(
    Array.from(body.rows, (r) => parseInt(r.cells[0].innerText, 10))
  );
  dtxIds.forEach((id) => {
    // Get all rows with an id cell matching the current id.
    const matchCells = Array.from(body.rows)
      .map((row) => row.cells[0])
      .filter((idCell) => {
        if (!idCell.innerText) {
          return false;
        }
        const cellId = parseInt(idCell.innerText, 10);
        return id === cellId;
      });
    const rowSpan = matchCells.length;
    // Don't need to proceed any further if there is only one row for the id.
    if (rowSpan > 1) {
      matchCells[0].rowSpan = rowSpan;
      const cellsToRemove = matchCells.splice(1);
      cellsToRemove.forEach((cell) => {
        const parent = cell.parentElement;
        if (parent) {
          parent.removeChild(cell);
        }
      });
    }
  });

  return table;
}

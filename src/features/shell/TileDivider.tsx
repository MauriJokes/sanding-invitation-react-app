import quatrefoilRosette from "../../assets/motif/divider/quatrefoil-rosette.png";
import scallopedRosette from "../../assets/motif/divider/scalloped-rosette.png";
import scrollworkRosette from "../../assets/motif/divider/scrollwork-rosette.png";
import leafyRosette from "../../assets/motif/divider/leafy-rosette.png";
import "./shell.css";

const tiles = [
  quatrefoilRosette,
  scrollworkRosette,
  leafyRosette,
  scallopedRosette,
];

export function TileDivider({ offset = 0 }: { offset?: number }) {
  const start = ((offset % tiles.length) + tiles.length) % tiles.length;
  const orderedTiles = [...tiles.slice(start), ...tiles.slice(0, start)];

  return (
    <div aria-hidden="true" className="tile-divider">
      {Array.from({ length: 6 }, (_, repeat) =>
        orderedTiles.map((tile, index) => (
          <img
            alt=""
            className="tile-divider__tile"
            draggable={false}
            key={`${repeat}-${index}`}
            loading="lazy"
            src={tile}
          />
        )),
      )}
    </div>
  );
}

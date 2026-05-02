import { Filter } from "pixi.js";
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from "../constants";

const FRAGMENT_SHADER = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec2 pixelGrid;

void main(void) {
  vec2 cell = max(pixelGrid, vec2(1.0));
  vec2 coord = (floor(vTextureCoord * cell) + 0.5) / cell;
  gl_FragColor = texture2D(uSampler, coord);
}
`;

export class PixelateFilter extends Filter {
  constructor() {
    super(undefined, FRAGMENT_SHADER, {
      pixelGrid: [INTERNAL_WIDTH, INTERNAL_HEIGHT]
    });
  }

  setAmount(amount: number): void {
    const expanded = Math.min(3, Math.max(0, amount));
    const blockSize = 1 + expanded * 30;
    this.uniforms.pixelGrid = [INTERNAL_WIDTH / blockSize, INTERNAL_HEIGHT / blockSize];
    this.enabled = expanded > 0.01;
  }
}

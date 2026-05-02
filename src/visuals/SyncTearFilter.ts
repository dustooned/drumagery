import { Filter } from "pixi.js";

const FRAGMENT_SHADER = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float amount;
uniform float time;
uniform float noiseAmount;

float random(vec2 value) {
  return fract(sin(dot(value, vec2(12.9898, 78.233))) * 43758.5453);
}

void main(void) {
  vec2 coord = vTextureCoord;
  float bands = 18.0 + amount * 52.0;
  float band = floor(coord.y * bands);
  float ramp = fract(coord.y * bands + time * (0.55 + amount * 1.8));
  float saw = ramp * 2.0 - 1.0;
  float bandNoise = random(vec2(band, floor(time * 28.0))) * 2.0 - 1.0;
  float tearGate = step(0.62 - amount * 0.32, random(vec2(band * 2.31, floor(time * 10.0))));
  float tear = (saw * 0.012 + bandNoise * 0.026 * tearGate) * amount;
  float scan = sin(coord.y * 720.0 * 3.14159);
  float staticNoise = random(coord * vec2(900.0, 520.0) + time) - 0.5;

  coord.x = clamp(coord.x + tear, 0.0, 1.0);

  vec4 color = texture2D(uSampler, coord);
  color.rgb += staticNoise * noiseAmount * amount * 0.22;
  color.rgb *= 1.0 - (0.035 + amount * 0.08) * max(0.0, scan);
  gl_FragColor = color;
}
`;

export class SyncTearFilter extends Filter {
  private elapsed = 0;

  constructor() {
    super(undefined, FRAGMENT_SHADER, {
      amount: 0,
      time: 0,
      noiseAmount: 0
    });
    this.enabled = false;
  }

  update(deltaSeconds: number, amount: number, noiseAmount: number): void {
    const expanded = Math.min(3, Math.max(0, amount));
    this.elapsed += deltaSeconds;
    this.uniforms.amount = expanded;
    this.uniforms.time = this.elapsed;
    this.uniforms.noiseAmount = Math.min(3, Math.max(0, noiseAmount));
    this.enabled = expanded > 0.01;
  }
}

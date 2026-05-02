import { Filter } from "pixi.js";

const FRAGMENT_SHADER = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float amount;
uniform float time;
uniform float chaosAmount;

float random(vec2 value) {
  return fract(sin(dot(value, vec2(41.13, 289.97))) * 43758.5453);
}

void main(void) {
  vec2 coord = vTextureCoord;
  float expanded = max(0.0, amount);
  float bands = 5.0 + expanded * 14.0;
  float band = floor(coord.y * bands);
  float localY = fract(coord.y * bands);
  float tick = floor(time * (8.0 + expanded * 10.0));
  float gateNoise = random(vec2(band * 3.17, tick));
  float bandGate = step(0.72 - expanded * 0.16, gateNoise);
  float blockOffset = (random(vec2(band, tick * 1.9)) * 2.0 - 1.0) * expanded * 0.075 * bandGate;
  float compression = 1.0 + bandGate * expanded * 0.1;
  float snappedY = (band + clamp((localY - 0.5) * compression + 0.5, 0.0, 1.0)) / bands;
  float edge = smoothstep(0.0, 0.045, localY) * (1.0 - smoothstep(0.955, 1.0, localY));
  float rollRipple = sin(coord.y * (64.0 + expanded * 42.0) + time * 10.0) * expanded * 0.006;

  coord.x = clamp(coord.x + blockOffset + rollRipple * (0.35 + chaosAmount * 0.18), 0.0, 1.0);
  coord.y = clamp(mix(coord.y, snappedY, bandGate * clamp(0.45 + expanded * 0.12, 0.0, 0.86)), 0.0, 1.0);

  vec4 color = texture2D(uSampler, coord);
  float bandFlash = bandGate * (1.0 - edge) * expanded;
  color.rgb += bandFlash * vec3(0.16, 0.19, 0.22);
  color.rgb *= 1.0 - bandGate * edge * expanded * 0.16;
  gl_FragColor = color;
}
`;

export class HardSyncBandsFilter extends Filter {
  private elapsed = 0;

  constructor() {
    super(undefined, FRAGMENT_SHADER, {
      amount: 0,
      time: 0,
      chaosAmount: 0
    });
    this.enabled = false;
  }

  update(deltaSeconds: number, amount: number, chaosAmount: number): void {
    const expanded = Math.min(3, Math.max(0, amount));
    this.elapsed += deltaSeconds;
    this.uniforms.amount = expanded;
    this.uniforms.time = this.elapsed;
    this.uniforms.chaosAmount = Math.min(3, Math.max(0, chaosAmount));
    this.enabled = expanded > 0.01;
  }
}

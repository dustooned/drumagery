import { Filter } from "pixi.js";

const FRAGMENT_SHADER = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float amount;
uniform float time;
uniform float chaosAmount;

float random(vec2 value) {
  return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453);
}

void main(void) {
  vec2 coord = vTextureCoord;
  float expanded = max(0.0, amount);
  float band = floor(coord.y * (22.0 + expanded * 24.0));
  float bandNoise = random(vec2(band, floor(time * 18.0))) - 0.5;
  float wave = sin(coord.y * 42.0 + time * (2.0 + expanded));
  float drift = (wave * 0.003 + bandNoise * 0.006 * chaosAmount) * expanded;
  float split = (0.0025 + expanded * 0.0065) * expanded;

  vec2 redCoord = clamp(coord + vec2(split + drift, 0.0), vec2(0.0), vec2(1.0));
  vec2 greenCoord = clamp(coord + vec2(drift * 0.35, 0.0), vec2(0.0), vec2(1.0));
  vec2 blueCoord = clamp(coord - vec2(split - drift, 0.0), vec2(0.0), vec2(1.0));

  vec4 redSample = texture2D(uSampler, redCoord);
  vec4 greenSample = texture2D(uSampler, greenCoord);
  vec4 blueSample = texture2D(uSampler, blueCoord);
  vec4 baseSample = texture2D(uSampler, coord);

  vec3 chroma = vec3(redSample.r, greenSample.g, blueSample.b);
  float mixAmount = clamp(0.45 + expanded * 0.18, 0.0, 1.0);
  gl_FragColor = vec4(mix(baseSample.rgb, chroma, mixAmount), baseSample.a);
}
`;

export class ChromaSplitFilter extends Filter {
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

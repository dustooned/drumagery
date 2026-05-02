import { Filter } from "pixi.js";

const FRAGMENT_SHADER = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float amount;
uniform float time;
uniform float tearAmount;

float random(vec2 value) {
  return fract(sin(dot(value, vec2(269.5, 183.3))) * 43758.5453);
}

void main(void) {
  vec2 coord = vTextureCoord;
  float expanded = max(0.0, amount);
  float rollSpeed = 0.035 + expanded * 0.19;
  float roll = time * rollSpeed;
  float holdLine = step(0.965 - expanded * 0.035, fract(coord.y * (2.0 + expanded * 4.0) - time * 0.42));
  float band = floor(coord.y * (9.0 + expanded * 18.0));
  float bandJitter = (random(vec2(band, floor(time * 16.0))) - 0.5) * tearAmount * expanded * 0.018;
  float wave = sin((coord.y + time * 0.08) * 38.0) * expanded * 0.004;

  coord.y = fract(coord.y + roll + holdLine * expanded * 0.05);
  coord.x = clamp(coord.x + bandJitter + wave, 0.0, 1.0);

  vec4 color = texture2D(uSampler, coord);
  float trackingLine = smoothstep(0.96, 1.0, fract(vTextureCoord.y * (2.0 + expanded * 4.0) - time * 0.42));
  color.rgb += trackingLine * expanded * 0.16;
  color.rgb *= 1.0 - holdLine * expanded * 0.18;
  gl_FragColor = color;
}
`;

export class VerticalRollFilter extends Filter {
  private elapsed = 0;

  constructor() {
    super(undefined, FRAGMENT_SHADER, {
      amount: 0,
      time: 0,
      tearAmount: 0
    });
    this.enabled = false;
  }

  update(deltaSeconds: number, amount: number, tearAmount: number): void {
    const expanded = Math.min(3, Math.max(0, amount));
    this.elapsed += deltaSeconds;
    this.uniforms.amount = expanded;
    this.uniforms.time = this.elapsed;
    this.uniforms.tearAmount = Math.min(3, Math.max(0, tearAmount));
    this.enabled = expanded > 0.01;
  }
}

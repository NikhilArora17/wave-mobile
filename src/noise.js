export const noise = {
  perm: new Uint8Array(512),
  gradP: new Array(512),
  init() {
    const grad3 = [ [1,1], [-1,1], [1,-1], [-1,-1], [1,0], [-1,0], [0,1], [0,-1] ];
    const p = [];
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 0; i < 256; i++) {
      const r = i + Math.floor(Math.random() * (256 - i));
      const tmp = p[i]; p[i] = p[r]; p[r] = tmp;
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.gradP[i] = grad3[this.perm[i] % 8];
    }
  },
  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); },
  lerp(a, b, t) { return (1 - t) * a + t * b; },
  perlin2(x, y) {
    const X = Math.floor(x), Y = Math.floor(y);
    x = x - X; y = y - Y;
    const gi00 = this.gradP[X + this.perm[Y]];
    const gi01 = this.gradP[X + this.perm[Y + 1]];
    const gi10 = this.gradP[X + 1 + this.perm[Y]];
    const gi11 = this.gradP[X + 1 + this.perm[Y + 1]];

    const u = this.fade(x);
    const v = this.fade(y);

    const n00 = gi00[0]*x + gi00[1]*y;
    const n10 = gi10[0]*(x - 1) + gi10[1]*y;
    const n01 = gi01[0]*x + gi01[1]*(y - 1);
    const n11 = gi11[0]*(x - 1) + gi11[1]*(y - 1);

    return this.lerp(
      this.lerp(n00, n10, u),
      this.lerp(n01, n11, u),
      v
    );
  }
};

noise.init();

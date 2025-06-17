export class ExpEngine {
  calculateLevel(exp: number): number {
    let level = 1
    while (this.calculateRequiredExp(level) <= exp) {
      level++
    }
    return level - 1
  }

  calculateRequiredExp(level: number): number {
    return level * level * 100
  }
}

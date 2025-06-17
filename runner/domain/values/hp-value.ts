import { z } from "zod/v4"

const zValue = z.number().int().min(0).max(999)

type Value = z.infer<typeof zValue>

export class HpValue {
  constructor(readonly value: Value) {
    Object.freeze(this)
  }

  /**
   * 上限制限
   */
  add(value: number): HpValue {
    return new HpValue(Math.min(this.value + value, 999))
  }

  /**
   * 下限制限
   */
  subtract(value: number): HpValue {
    return new HpValue(Math.max(this.value - value, 0))
  }

  get isZero() {
    return this.value === 0
  }
}

import { z } from "zod/v4"

const zValue = z.number().min(0).max(999)

type Value = z.infer<typeof zValue>

class HpValue {
  readonly value: Value

  constructor(value: Value) {
    this.value = zValue.parse(value)
  }

  add(value: number): HpValue {
    return new HpValue(Math.min(this.value + value, 999)) // 上限制限
  }

  subtract(value: number): HpValue {
    return new HpValue(Math.max(this.value - value, 0)) // 下限制限
  }

  equals(other: HpValue): boolean {
    return this.value === other.value
  }

  isZero(): boolean {
    return this.value === 0
  }
}

const hpValue = new HpValue(16).add(4)

console.log(hpValue.value) // 20

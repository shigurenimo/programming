import { z } from "zod/v4"
import { HpValue } from "../values/hp-value"

const zProps = z.object({
  id: z.string(),
  hp: z.instanceof(HpValue),
  mp: z.instanceof(HpValue),
  maxHp: z.instanceof(HpValue),
  exp: z.number().nonnegative(),
  level: z.number().nonnegative(),
})

type Props = z.infer<typeof zProps>

export class PlayerEntity implements Props {
  readonly id!: Props["id"]

  readonly hp!: Props["hp"]

  readonly mp!: Props["mp"]

  readonly maxHp!: Props["hp"]

  readonly exp!: Props["exp"]

  readonly level!: Props["level"]

  constructor(props: Props) {
    Object.assign(this, zProps.parse(props))
    Object.freeze(this)
  }

  takeDamage(value: number) {
    return new PlayerEntity({
      ...this,
      hp: this.hp.subtract(value),
    })
  }

  addHp(value: number) {
    return new PlayerEntity({
      ...this,
      hp: this.hp.add(value),
    })
  }

  consumeMp(value: number) {
    return new PlayerEntity({
      ...this,
      mp: this.mp.subtract(value),
    })
  }

  withExp(value: number) {
    return new PlayerEntity({
      ...this,
      exp: this.exp + value,
    })
  }

  withLevel(level: number) {
    return new PlayerEntity({
      ...this,
      level,
    })
  }

  get isDead(): boolean {
    return this.hp.isZero
  }

  static create() {
    return new PlayerEntity({
      id: crypto.randomUUID(),
      hp: new HpValue(16),
      mp: new HpValue(8),
      maxHp: new HpValue(16),
      exp: 0,
      level: 1,
    })
  }
}

import { z } from "zod/v4"
import { HpValue } from "./domain/values/hp-value"

const zProps = z.object({
  id: z.string(),
  hp: z.instanceof(HpValue),
  mp: z.instanceof(HpValue),
  maxHp: z.instanceof(HpValue),
})

type Props = z.infer<typeof zProps>

export class MonsterEntity implements Props {
  readonly id!: Props["id"]

  readonly hp!: Props["hp"]

  readonly mp!: Props["mp"]

  readonly maxHp!: Props["hp"]

  constructor(props: Props) {
    Object.assign(this, zProps.parse(props))
    Object.freeze(this)
  }

  takeDamage(value: number) {
    return new MonsterEntity({
      ...this,
      hp: this.hp.subtract(value),
    })
  }

  get isDead(): boolean {
    return this.hp.isZero
  }

  static create() {
    return new MonsterEntity({
      id: crypto.randomUUID(),
      hp: new HpValue(16),
      mp: new HpValue(8),
      maxHp: new HpValue(16),
    })
  }

  static createFromLevel(level: number) {
    const baseHp = level * 10
    return new MonsterEntity({
      id: crypto.randomUUID(),
      hp: new HpValue(baseHp),
      mp: new HpValue(level * 5),
      maxHp: new HpValue(baseHp),
    })
  }
}

const slime = MonsterEntity.create()

const dragon = MonsterEntity.createFromLevel(10)

console.log(slime.hp.value) // 16

console.log(dragon.hp.value) // 100

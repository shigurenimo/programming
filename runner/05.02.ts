import { z } from "zod"
import { HpValue } from "./domain/values/hp-value"

const zProps = z.object({
  hp: z.instanceof(HpValue),
  mp: z.instanceof(HpValue),
  maxHp: z.instanceof(HpValue),
  name: z.string().min(1).max(8),
})

type Props = z.infer<typeof zProps>

class Monster implements Props {
  readonly hp!: Props["hp"]
  readonly mp!: Props["mp"]
  readonly maxHp!: Props["maxHp"]
  readonly name!: Props["name"]

  constructor(props: Props) {
    Object.assign(this, zProps.parse(props))
    Object.freeze(this)
    if (this.maxHp.value < this.hp.value) {
      throw new Error(`HP cannot exceed maxHp: ${this.maxHp.value}`)
    }
  }

  castHeal(): Monster {
    return new Monster({
      ...this,
      hp: this.hp.add(16),
      mp: this.mp.subtract(8),
    })
  }

  takeDamage(value: number): Monster {
    return new Monster({
      ...this,
      hp: this.hp.subtract(value),
    })
  }

  get isDead(): boolean {
    return this.hp.isZero
  }
}

const monster = new Monster({
  hp: new HpValue(16),
  mp: new HpValue(8),
  maxHp: new HpValue(32),
  name: "slime",
})

const draft = monster.castHeal().takeDamage(128)

console.log("isDead", draft.isDead) // true

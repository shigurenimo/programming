import { z } from "zod/v4"

const zProps = z.object({
  hp: z.number().min(0).max(999),
  mp: z.number().min(0).max(999),
  maxHp: z.number().min(1).max(999),
})

type Props = z.infer<typeof zProps>

class Monster implements Props {
  readonly hp!: Props["hp"]
  readonly mp!: Props["mp"]
  readonly maxHp!: Props["maxHp"]

  constructor(props: Props) {
    Object.assign(this, zProps.parse(props))
    Object.freeze(this)
    if (this.maxHp < this.hp) {
      throw new Error(`HP cannot exceed maxHp: ${this.maxHp}`)
    }
  }

  castHeal() {
    return new Monster({
      ...this,
      hp: Math.min(this.hp + 16, this.maxHp), // 最大値制限
      mp: this.mp - 8,
    })
  }
}

const monster = new Monster({
  hp: 16,
  mp: 8,
  maxHp: 32,
})

const draft = monster.castHeal()

console.log(draft.hp) // 32

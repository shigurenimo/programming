import { z } from "zod/v4"
import { HpValue } from "./domain/values/hp-value"

const zProps = z.object({
  id: z.string(),
  hp: z.instanceof(HpValue),
  mp: z.instanceof(HpValue),
})

type Props = z.infer<typeof zProps>

export class PlayerEntity implements Props {
  readonly id!: Props["id"]

  readonly hp!: Props["hp"]

  readonly mp!: Props["mp"]

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

  consumeMp(value: number) {
    return new PlayerEntity({
      ...this,
      mp: this.mp.subtract(value),
    })
  }
}

const player = new PlayerEntity({
  id: crypto.randomUUID(),
  hp: new HpValue(100),
  mp: new HpValue(50),
})

const draft = player.takeDamage(20).consumeMp(10)

console.log("draft", draft.hp.value, draft.mp.value) // 80, 40

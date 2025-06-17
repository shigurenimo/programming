import { z } from "zod/v4"

const zProps = z.object({
  name: z.string(),
  cost: z.number().min(0).max(999),
  value: z.number().min(0).max(999),
  type: z.enum(["ATTACK", "HEAL", "BUFF", "DEBUFF"]),
  duration: z.number().min(0).max(999).nullable(),
})

type Props = z.infer<typeof zProps>

class SpellValue implements Props {
  readonly name!: Props["name"]
  readonly cost!: Props["cost"]
  readonly value!: Props["value"]
  readonly type!: Props["type"]
  readonly duration!: Props["duration"]

  constructor(props: Props) {
    Object.assign(this, zProps.parse(props))
    Object.freeze(this)

    if (this.type === "ATTACK" && this.duration !== null) {
      throw new Error("Attack spells cannot have a duration")
    }
  }
}

const spellValue = new SpellValue({
  name: "Fireball",
  cost: 10,
  value: 30,
  type: "ATTACK",
  duration: null,
})

console.log("spellValue", spellValue.duration) // null?

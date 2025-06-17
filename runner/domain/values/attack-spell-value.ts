import { z } from "zod/v4"

const zProps = z.object({
  name: z.string(),
  cost: z.number().min(0).max(999),
  value: z.number().min(0).max(999),
})

type Props = z.infer<typeof zProps>

export class SimpleSpellValue implements Props {
  readonly name!: Props["name"]

  readonly cost!: Props["cost"]

  readonly value!: Props["value"]

  constructor(props: Props) {
    Object.assign(this, zProps.parse(props))
    Object.freeze(this)
  }
}

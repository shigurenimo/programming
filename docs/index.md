# TypeScript

このページにはAIに読み書きしやすいコードを生成する為の知見をまとめています。

今日のAIはToolsを通してターミナルやブラウザの出力をコンテキストに含めることができます。
多くの不具合を型レベルで検出できる事、ランタイムでも検出できる事を重点的に考えています。

## 00.イミュータブルなオブジェクト

最初に基本的なオブジェクトを定義します。

```ts
type Monster = {
  name: string
  hp: number
  mp: number
}

const monster: Monster = {
  name: "slime",
  hp: 16,
  mp: 8
}
```

型の定義により、オブジェクトの構造が明確になります。この段階では、プロパティの直接変更が可能です。

```ts
type Monster = {
  name: string
  hp: number
  mp: number
}

const monster: Monster = {
  name: "slime",
  hp: 16,
  mp: 8
}

monster.hp += 16 // 32
monster.mp -= 8 // 0

console.log(monster.hp) // 32
```

魔法を唱えることでMPを消費してHPを回復させる処理を実装します。

```ts
type Monster = {
  name: string
  hp: number
  mp: number
}

const monster: Monster = {
  name: "slime",
  hp: 16,
  mp: 8
}

monster.hp += 16 // 32
monster.mp -= 8 // 0

console.log(monster.hp) // 32
```

この実装では、オブジェクトの値が自由に変更されてしまいます。予期しない副作用を防ぐため、オブジェクトの変更を制限する必要があります。

更に`Object.freeze`を使用してオブジェクトの書き換えを防止します。

```ts
type Monster = {
  name: string
  hp: number
  isDead: boolean
}

const monster: Monster = Object.freeze({
  name: "slime",
  hp: 16,
  isDead: false,
})

monster.hp -= 999 // TypeError: Cannot assign to read only property
```

値を変更する代わりに、新しいオブジェクトを作成する方法を採用します。

```ts
type Monster = {
  name: string
  hp: number
  mp: number
}

const monster: Monster = Object.freeze({
  name: "slime",
  hp: 16,
  mp: 8,
})

const draftMonster = {
  ...monster,
  hp: monster.hp + 16, // 回復
  mp: monster.mp - 8, // 消費
}

console.log(draftMonster.hp) // 32
console.log(monster.hp) // 16（元の値は保持される）
```

この方法により、元のオブジェクトは変更されず、状態変更の履歴が追跡可能になります。

## 01.オブジェクトを検証する

間違ったオブジェクトが定義されないようにランタイムでのバリデーションを行います。

```ts
const zMonster = z.object({
  name: z.string(),
  hp: z.number(),
})

const monster = Object.freeze(
  zMonster.parse({
    name: 'slime',
    hp: 16,
  })
)
```

更にこのように型を定義する事で型レベルの検証が可能になります。

```ts
const zMonster = z.object({
  name: z.string(),
  hp: z.number(),
})

type Monster = z.infer<typeof zMonster>

const monster = zMonster.parse({
  name: 'slime',
  hp: 16,
} satisfies Monster)
```

## 02.ビジネスルールの導入

ゲームのルールを実装します。

- モンスターのHPは0未満になってはいけない
- HPが0になった場合、そのモンスターは死亡状態とする

これらのルールを関数として表現します。

```ts
type Monster = {
  name: string
  hp: number
  mp: number
}

function castSpell(monster: Monster): Monster {
  return {
    ...monster,
    hp: monster.hp + 16, // 回復
    mp: monster.mp - 8, // 消費
  }
}

function takeDamage(monster: Monster, value: number): Monster {
  return {
    ...monster,
    hp: Math.max(monster.hp - value, 0), // 0未満にならないよう制限
  }
}

const monster: Monster = Object.freeze({
  name: "slime",
  hp: 16,
  mp: 8,
})

const healedMonster = castSpell(monster)
const damagedMonster = takeDamage(monster, 28)
```

関数を使用することで、ビジネスルールが明示的に表現され、再利用可能になります。

## 03.クラス

関連する状態と振る舞いを一つの単位として扱うため、クラスを使用します。クラスは関数の糖衣構文として機能し、メソッドチェーンによるFluentなAPIを提供します。

```ts
type Props = {
  name: string
  hp: number
  mp: number
}

class Monster implements Props {
  readonly name!: string
  readonly hp!: number
  readonly mp!: number

  constructor(props: Props) {
    Object.assign(this, props)
    Object.freeze(this) // 書き換えを禁止
  }

  castSpell() {
    return new Monster({
      ...this,
      hp: this.hp + 16, // 回復
      mp: this.mp - 8, // 消費
    })
  }

  takeDamage(value: number) {
    return new Monster({
      ...this,
      hp: Math.max(this.hp - value, 0),
    })
  }
}

const monster = new Monster({
  name: "slime",
  hp: 16,
  mp: 8,
})
  .castSpell() // hp: 32, mp: 0
  .takeDamage(28) // hp: 4, mp: 0
```

ビジネスルールを含みながら概念を表現するオブジェクトをEntityと呼びます。各メソッドは新しいインスタンスを返すため、イミュータブルな性質が保たれます。

## 04.状態の表現

オブジェクトの状態を判定するためのプロパティを定義します。Getterを使用して、状態判定のロジックを一箇所に集約します。

```ts
type Props = {
  hp: number
}

class Monster implements Props {
  readonly hp!: number

  constructor(props: Props) {
    Object.assign(this, props)
    Object.freeze(this)
  }

  takeDamage(value: number) {
    return new Monster({
      ...this,
      hp: Math.max(this.hp - value, 0),
    })
  }

  get isDead() {
    return this.hp === 0
  }
}

const monster = new Monster({ hp: 16 })
  .takeDamage(12)
  .takeDamage(12)

console.log(monster.isDead) // true
```

状態判定ロジックがGetterに集約されることで、ルール変更時の影響範囲が限定されます。

## 05.値オブジェクト

より複雑なルールを実装する場合を考えます。

- HPの最大値は999
- 回復は最大値を超えない
- ダメージによりHPが0未満になることはない

ライブラリ「Zod」を使用して値の検証を行います。

```ts
import { z } from "zod/v4"

const zProps = z.object({
  hp: z.number().min(0).max(999),
  mp: z.number().min(0).max(999),
  maxHp: z.number().min(1).max(999),
})

type Props = z.infer<typeof zProps>

class Monster implements Props {
  readonly hp!: Props['hp']
  readonly mp!: Props['mp']
  readonly maxHp!: Props['maxHp']

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
```

ルールが増加するとEntityが複雑になります。値オブジェクトを使用してルールを分離します。

```ts
import { z } from "zod/v4"

const zValue = z.number().min(0).max(999)
type Value = z.infer<typeof zValue>

class HpValue {
  readonly value: Value

  constructor(value: Value) {
    this.value = zValue.parse(value)
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

  get isZero(): boolean {
    return this.value === 0
  }
}
```

値オブジェクトは値そのものと、その値に対する操作を表現します。すべての計算ルールが値オブジェクト内に集約されるため、Entityは値の計算方法を意識する必要がありません。

Entityと値オブジェクトを組み合わせます。

```ts
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
```

Entityは値の計算詳細を知る必要がなくなり、ビジネスロジックに集中できます。

## 06.ファクトリーパターン

Entityの生成が複雑になった場合、ファクトリーパターンを使用して生成ロジックを分離します。

小規模なアプリケーションでは、Entityにstaticメソッドを追加します。

```ts
class MonsterEntity {
  // 既存のコード...

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
```

より複雑な生成ロジックには、専用のファクトリークラスを作成します。

```ts
import { HpValue } from "./domain/values/hp-value"
import { MonsterEntity } from "./domain/entities/monster-entity"

class MonsterFactory {
  create(type: string, level: number): MonsterEntity {
    if (type === "slime") {
      return new MonsterEntity({
        id: crypto.randomUUID(),
        hp: new HpValue(level * 8),
        maxHp: new HpValue(level * 8),
        mp: new HpValue(level * 4),
      })
    }

    if (type === "dragon") {
      return new MonsterEntity({
        id: crypto.randomUUID(),
        hp: new HpValue(level * 20),
        maxHp: new HpValue(level * 20),
        mp: new HpValue(level * 15),
      })
    }

    throw new Error(`Unknown monster type: ${type}`)
  }
}

const factory = new MonsterFactory()

const slime = factory.create("slime", 4)

console.log(slime.hp.value) // 16
```

ファクトリーパターンにより、複雑な生成ロジックがEntityから分離され、コードの可読性が向上します。

## 07.複数Entityの操作

プレイヤーとモンスターを同時に更新する場合を考えます。プレイヤーがMPを消費してモンスターにダメージを与える処理を実装します。

プレイヤーEntityを定義します。

```ts
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
```

複数のEntityにまたがる操作にはドメインサービスを使用します。

```ts
import { MonsterEntity } from "./domain/entities/simple-monster-entity"
import { PlayerEntity } from "./domain/entities/simple-player-entity"
import { HpValue } from "./domain/values/hp-value"

class BattleService {
  castFireball(player: PlayerEntity, monster: MonsterEntity) {
    const manaCost = 8
    const damage = 16

    const draftPlayer = player.consumeMp(manaCost)

    const draftMonster = monster.takeDamage(damage)

    return {
      player: draftPlayer,
      monster: draftMonster,
    }
  }
}

const player = new PlayerEntity({
  id: crypto.randomUUID(),
  hp: new HpValue(100),
  mp: new HpValue(50),
})

const monster = new MonsterEntity({
  id: crypto.randomUUID(),
  hp: new HpValue(80),
  maxHp: new HpValue(80),
  mp: new HpValue(20),
})

const battleService = new BattleService()

const result = battleService.castFireball(player, monster)

console.log(result.player)
```

ドメインサービスは、単一のEntityでは表現できないビジネスロジックを担当します。

## 08.集約

戦闘そのものが状態を持つ場合、集約として表現します。永続化が必要なオブジェクトは集約として扱います。

```ts
import { z } from "zod/v4"
import { MonsterEntity } from "./domain/entities/monster-entity"
import { PlayerEntity } from "./domain/entities/player-entity"
import { HpValue } from "./domain/values/hp-value"

const zProps = z.object({
  id: z.string(),
  player: z.instanceof(PlayerEntity),
  monster: z.instanceof(MonsterEntity),
  turn: z.number().nonnegative(),
  isFinished: z.boolean(),
})

type Props = z.infer<typeof zProps>

class BattleEntity implements Props {
  readonly id!: Props["id"]
  readonly player!: Props["player"]
  readonly monster!: Props["monster"]
  readonly turn!: Props["turn"]
  readonly isFinished!: Props["isFinished"]

  constructor(props: Props) {
    Object.assign(this, zProps.parse(props))
    Object.freeze(this)
  }

  castFireball(): BattleEntity {
    if (this.isFinished) {
      throw new Error("戦闘が既に終了しています")
    }

    const draftPlayer = this.player.consumeMp(8)

    const draftMonster = this.monster.takeDamage(16)

    return new BattleEntity({
      ...this,
      player: draftPlayer,
      monster: draftMonster,
    })
  }

  nextTurn(): BattleEntity {
    const isFinished = this.player.isDead || this.monster.isDead

    return new BattleEntity({
      ...this,
      turn: this.turn + 1,
      isFinished,
    })
  }
}
```

使用例：

```ts
const battleEntity = new BattleEntity({
  id: crypto.randomUUID(),
  player: new PlayerEntity({
    id: crypto.randomUUID(),
    hp: new HpValue(100),
    maxHp: new HpValue(100),
    mp: new HpValue(50),
  }),
  monster: new MonsterEntity({
    id: crypto.randomUUID(),
    hp: new HpValue(32),
    maxHp: new HpValue(32),
    mp: new HpValue(0),
  }),
  turn: 0,
  isFinished: false,
})

const draft = battleEntity.castFireball().nextTurn().castFireball().nextTurn()

console.log("Draft Player HP:", draft.player.hp.value)
```

集約は、データの整合性を保つ境界として機能します。集約を通じてのみ内部のEntityを操作することで、ビジネスルールの適用が保証されます。

## 09.クラスをシンプルに保つ

Entityが複雑になってきた場合、責務を分離することでシンプルに保ちます。経験値計算を例に説明します。

これは、すべてをEntityに詰め込んだ例です。

```ts
type Props = {
  id: string
  exp: number
  level: number
}

class PlayerEntity {
  readonly id!: string
  readonly exp!: number
  readonly level!: number

  constructor(props: Props) {
    Object.assign(this, props)
    Object.freeze(this)
  }

  addExp(value: number): PlayerEntity {
    const newExp = this.exp + value

    // レベル計算がEntity内に埋め込まれている
    let newLevel = 1
    let requiredExp = 0

    while (requiredExp <= newExp) {
      newLevel++
      requiredExp = newLevel * newLevel * 100
    }

    return new PlayerEntity({
      ...this,
      exp: newExp,
      level: newLevel - 1,
    })
  }
}

const playerEntity = new PlayerEntity({
  id: crypto.randomUUID(),
  exp: 0,
  level: 1,
})

const draft = playerEntity.addExp(1028)

console.log("level", draft.level) // 4
```

経験値計算を専用のクラスに分離します。

```ts
class ExpEngine {
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

const expEngine = new ExpEngine()

const playerExp = 1028

const playerLevel = expEngine.calculateLevel(playerExp)

console.log("level", playerLevel) // 3
```

ドメインサービスで経験値エンジンを使用します。

```ts
import { PlayerEntity } from "./domain/entities/player-entity"
import { ExpEngine } from "./domain/modules/exp-engine"

class LevelingService {
  constructor(private expEngine: ExpEngine) {}

  addExp(player: PlayerEntity, gainedExp: number): PlayerEntity {
    const newExp = player.exp + gainedExp

    const newLevel = this.expEngine.calculateLevel(newExp)

    return player.withExp(newExp).withLevel(newLevel)
  }
}

const service = new LevelingService(new ExpEngine())

const draft = service.addExp(PlayerEntity.create(), 1028)

console.log("level", draft.level) // 3
```

## 10.Union型による種類の表現

複数の種類を持つオブジェクトを表現する場合、Union型を使用します。

単一クラスでの実装例:

```ts
import { z } from "zod/v4"

const zProps = z.object({
  name: z.string(),
  cost: z.number().min(0).max(999),
  value: z.number().min(0).max(999),
  type: z.enum(['ATTACK', 'HEAL', 'BUFF', 'DEBUFF']),
  duration: z.number().min(0).max(999).nullable(),
})

type Props = z.infer<typeof zProps>

export class SpellValue implements Props {
  readonly name!: Props["name"]
  readonly cost!: Props["cost"]
  readonly value!: Props["value"]
  readonly type!: Props["type"]
  readonly duration!: Props["duration"]

  constructor(props: Props) {
    Object.assign(this, zProps.parse(props))
    Object.freeze(this)
    
    if (this.type === 'ATTACK' && this.duration !== null) {
      throw new Error("Attack spells cannot have a duration")
    }
  }
}
```

この実装では、constructorでの場合分けが複雑になります。

種類ごとにクラスを分離した実装：

```ts
import { z } from "zod/v4"


const zAttackSpellProps = z.object({
  name: z.string(),
  cost: z.number().min(0).max(999),
  damage: z.number().min(1).max(999),
})

export class AttackSpell {
  readonly name!: string
  readonly cost!: number
  readonly damage!: number

  constructor(props: z.infer<typeof zAttackSpellProps>) {
    Object.assign(this, zAttackSpellProps.parse(props))
    Object.freeze(this)
  }
}

const zHealSpellProps = z.object({
  name: z.string(),
  cost: z.number().min(0).max(999),
  healAmount: z.number().min(1).max(999),
})

class HealSpell {
  readonly name!: string
  readonly cost!: number
  readonly healAmount!: number

  constructor(props: z.infer<typeof zHealSpellProps>) {
    Object.assign(this, zHealSpellProps.parse(props))
    Object.freeze(this)
  }
}

const zBuffSpellProps = z.object({
  name: z.string(),
  cost: z.number().min(0).max(999),
  effect: z.string(),
  duration: z.number().min(1).max(10),
})

class BuffSpell {
  readonly name!: string
  readonly cost!: number
  readonly effect!: string
  readonly duration!: number

  constructor(props: z.infer<typeof zBuffSpellProps>) {
    Object.assign(this, zBuffSpellProps.parse(props))
    Object.freeze(this)
  }
}
```

Union型でこれらの種類をまとめます：

```ts
type SpellValue = AttackSpellValue | HealSpellValue | BuffSpellValue

class BattleService {
  castSpell(props: {
    spell: SpellValue
    caster: PlayerEntity
    target: MonsterEntity | null
  }) {
    if (props.spell instanceof AttackSpellValue) {
      return {
        caster: props.caster.consumeMp(props.spell.cost),
        target: props.target?.takeDamage(props.spell.damage),
      }
    }

    if (props.spell instanceof HealSpellValue) {
      return {
        caster: props.caster
          .consumeMp(props.spell.cost)
          .addHp(props.spell.healAmount),
        target: props.target,
      }
    }

    throw new Error("Unsupported spell type")
  }
}

const service = new BattleService()

const result = service.castSpell({
  spell: new AttackSpellValue({
    name: "Fireball",
    cost: 10,
    damage: 30,
  }),
  caster: PlayerEntity.create(),
  target: MonsterEntity.createFromLevel(1),
})

console.log("result", result)
```

Union型により、TypeScriptの型システムが各種類を適切に識別し、型安全性が保たれます。新しい種類を追加した際の対応漏れもコンパイル時に検出できます。

## 有限オートマトン

1つのEntityを特定の用途で分離するのには、他にも利点があります。

戦闘では、段階ごとに状態が変化します。この状態変化を有限オートマトンパターンで表現することで、複雑な戦闘フローを明確に管理できます。

まず、有限オートマトンを使わない場合の問題を確認します。単一のEntityで段階を管理する実装を考えてみます。

```ts
import { z } from "zod/v4"
import { PlayerEntity } from "./domain/entities/player-entity"
import { MonsterEntity } from "./domain/entities/monster-entity"

const zBattleEntityProps = z.object({
  id: z.string(),
  player: z.instanceof(PlayerEntity),
  monster: z.instanceof(MonsterEntity),
  phase: z.enum(["preparation", "execution", "end"]),
})

type Props = z.infer<typeof zBattleEntityProps>

class BattleEntity implements Props {
  readonly id!: string
  readonly player!: PlayerEntity
  readonly monster!: MonsterEntity
  readonly phase!: "preparation" | "execution" | "end"

  constructor(props: Props) {
    Object.assign(this, zBattleEntityProps.parse(props))
    Object.freeze(this)
  }

  withPhase(newPhase: "preparation" | "execution" | "end"): BattleEntity {
    return new BattleEntity({
      ...this,
      phase: newPhase,
    })
  }
}
```

この実装には以下の問題があります：

```ts
const battle = new BattleEntity({
  id: crypto.randomUUID(),
  player: PlayerEntity.create(),
  monster: MonsterEntity.createFromLevel(3),
  phase: "preparation",
})

// 問題1: 不正な段階遷移がコンパイル時に検出されない
const invalidBattle = battle.withPhase("end") // preparation → end への直接遷移

// 問題2: 論理的に正しくない状態でも作成できてしまう
const inconsistentBattle = battle.withPhase("end") // 戦闘が終了しているが勝者が不明

// 問題3: 段階の制約がメソッドレベルで表現されない
// どの段階でも withPhase が呼び出し可能
```

これらの問題を解決するため、段階ごとに異なるEntityクラスを定義する有限オートマトンパターンを使用します。

戦闘は以下の3つの段階を持つものとします:

- 準備段階: 戦闘開始前の状態
- 実行段階: 戦闘行動を実行する段階
- 終了段階: 戦闘が完了した状態

各段階を表現するEntityを定義します。

```ts
import { z } from "zod/v4"
import { PlayerEntity } from "./domain/entities/player-entity"
import { MonsterEntity } from "./domain/entities/monster-entity"

const zBattlePreparationProps = z.object({
  id: z.string(),
  player: z.instanceof(PlayerEntity),
  monster: z.instanceof(MonsterEntity),
})

export class BattlePreparationEntity {
  readonly id!: string
  readonly player!: PlayerEntity
  readonly monster!: MonsterEntity

  constructor(props: z.infer<typeof zBattlePreparationProps>) {
    Object.assign(this, zBattlePreparationProps.parse(props))
    Object.freeze(this)
  }

  startBattle(): BattleExecutionEntity {
    return new BattleExecutionEntity({
      id: this.id,
      player: this.player,
      monster: this.monster,
      turn: 1,
    })
  }
}

const zBattleExecutionProps = z.object({
  id: z.string(),
  player: z.instanceof(PlayerEntity),
  monster: z.instanceof(MonsterEntity),
  turn: z.number().min(1),
})

export class BattleExecutionEntity {
  readonly id!: string
  readonly player!: PlayerEntity
  readonly monster!: MonsterEntity
  readonly turn!: number

  constructor(props: z.infer<typeof zBattleExecutionProps>) {
    Object.assign(this, zBattleExecutionProps.parse(props))
    Object.freeze(this)
  }

  executeAttack(): BattleExecutionEntity | BattleEndEntity {
    const updatedPlayer = this.player.consumeMp(5)
    const updatedMonster = this.monster.takeDamage(20)

    if (updatedPlayer.isDead || updatedMonster.isDead) {
      return new BattleEndEntity({
        id: this.id,
        player: updatedPlayer,
        monster: updatedMonster,
        winner: updatedPlayer.isDead ? "monster" : "player",
      })
    }

    return new BattleExecutionEntity({
      id: this.id,
      player: updatedPlayer,
      monster: updatedMonster,
      turn: this.turn + 1,
    })
  }
}

const zBattleEndProps = z.object({
  id: z.string(),
  player: z.instanceof(PlayerEntity),
  monster: z.instanceof(MonsterEntity),
  winner: z.enum(["player", "monster"]),
})

export class BattleEndEntity {
  readonly id!: string
  readonly player!: PlayerEntity
  readonly monster!: MonsterEntity
  readonly winner!: "player" | "monster"

  constructor(props: z.infer<typeof zBattleEndProps>) {
    Object.assign(this, zBattleEndProps.parse(props))
    Object.freeze(this)
  }
}
```

各状態クラスのメソッドで直接遷移します：

```ts
let battleState = new BattlePreparationEntity({
  id: crypto.randomUUID(),
  player: PlayerEntity.create(),
  monster: MonsterEntity.createFromLevel(3),
})

// 準備段階から実行段階へ遷移
battleState = battleState.startBattle()
console.log("戦闘開始")

// 実行段階で攻撃を繰り返し、終了条件まで継続
while (battleState instanceof BattleExecutionEntity) {
  const result = battleState.executeAttack()
  
  if (result instanceof BattleEndEntity) {
    console.log(`戦闘終了 - 勝者: ${result.winner}`)
    break
  }
  
  battleState = result
  console.log(`ターン ${battleState.turn} 完了`)
}
```

より複雑な戦闘ロジックが必要な場合、遷移を管理するドメインサービスを定義できます：

```ts
type BattleState = BattlePreparationEntity | BattleExecutionEntity | BattleEndEntity

class BattleTransitionService {
  startBattle(preparation: BattlePreparationEntity): BattleExecutionEntity {
    console.log("戦闘準備完了")
    return preparation.startBattle()
  }

  executePlayerTurn(execution: BattleExecutionEntity): BattleExecutionEntity | BattleEndEntity {
    console.log(`ターン ${execution.turn}: プレイヤーの攻撃`)
    
    const result = execution.executeAttack()
    
    if (result instanceof BattleEndEntity) {
      console.log(`戦闘終了 - 勝者: ${result.winner}`)
      return result
    }

    console.log(`ターン ${result.turn} 完了`)
    return result
  }

  processBattle(initialState: BattlePreparationEntity): BattleExecutionEntity | BattleEndEntity {
    const currentState: BattleState = this.startBattle(initialState)

    if (currentState instanceof BattleExecutionEntity) {
      return this.executePlayerTurn(currentState)
    }

    return currentState
  }
}

const transitionService = new BattleTransitionService()

const initialBattle = new BattlePreparationEntity({
  id: crypto.randomUUID(),
  player: PlayerEntity.create(),
  monster: MonsterEntity.createFromLevel(3),
})

const finalResult = transitionService.processBattle(initialBattle)

if (finalResult instanceof BattleEndEntity) {
  console.log(`最終結果: ${finalResult.winner}の勝利`)
} else {
  console.log(`戦闘中断 - ターン ${finalResult.turn}`)
}
```

## Repository

Repositoryパターンは、データの永続化と取得を抽象化し、ドメインロジックからデータストレージの詳細を分離します。

ローカルストレージを使用したリポジトリクラスを定義します。

```ts
import { PlayerEntity } from "./domain/entities/player-entity"
import { HpValue } from "./domain/values/hp-value"

class LocalStoragePlayerRepository {
  private readonly storageKey = "players"

  async save(player: PlayerEntity): Promise<void> {
    const players = this.getAllPlayers()
    const index = players.findIndex(p => p.id === player.id)
    
    const playerData = {
      id: player.id,
      hp: player.hp.value,
      mp: player.mp.value,
    }

    if (index >= 0) {
      players[index] = playerData
    } else {
      players.push(playerData)
    }

    localStorage.setItem(this.storageKey, JSON.stringify(players))
  }
}
```

Application Serviceでリポジトリを使用します。

```ts
const player = new PlayerEntity({
  id: crypto.randomUUID(),
  hp: new HpValue(100),
  mp: new HpValue(50),
})

await this.playerRepository.save(player)
```

Repositoryパターンにより、データストレージの実装詳細がドメインロジックから分離されると考えられます。テスト時にはメモリ内実装、本番環境では異なるストレージ方式を使い分けることができると思われます。

## Application Service

ドメインサービスは純粋なビジネスロジックに集中しますが、アプリケーションとしては外部からの入力処理、永続化、トランザクション管理などが必要です。Application Serviceは、これらの責務を担当します。

Application Serviceの返り値をAppStateEntityとして構造化します。

```ts
import { z } from "zod/v4"
import { BattleEntity } from "./domain/entities/battle-entity"
import { PlayerEntity } from "./domain/entities/player-entity"
import { MonsterEntity } from "./domain/entities/monster-entity"

const zBattleAppStateProps = z.object({
  battleId: z.string(),
  status: z.enum(["preparation", "ongoing", "finished"]),
  playerData: z.object({
    id: z.string(),
    hp: z.number(),
    mp: z.number(),
  }),
  monsterData: z.object({
    id: z.string(),
    hp: z.number(),
  }),
  turn: z.number(),
  winner: z.enum(["player", "monster"]).nullable(),
  message: z.string(),
})

type Props = z.infer<typeof zBattleAppStateProps>

class BattleAppStateEntity implements Props {
  readonly battleId!: Props["battleId"]
  readonly status!: Props["status"]
  readonly playerData!: Props["playerData"]
  readonly monsterData!: Props["monsterData"]
  readonly turn!: Props["turn"]
  readonly winner!: Props["winner"]
  readonly message!: Props["message"]

  constructor(props: Props) {
    Object.assign(this, zBattleAppStateProps.parse(props))
    Object.freeze(this)
  }

  static fromBattleEntity(battle: BattleEntity, message: string): BattleAppStateEntity {
    return new BattleAppStateEntity({
      battleId: battle.id,
      status: battle.isFinished ? "finished" : "ongoing",
      playerData: {
        id: battle.player.id,
        hp: battle.player.hp.value,
        mp: battle.player.mp.value,
      },
      monsterData: {
        id: battle.monster.id,
        hp: battle.monster.hp.value,
      },
      turn: battle.turn,
      winner: battle.isFinished 
        ? (battle.player.isDead ? "monster" : "player")
        : null,
      message,
    })
  }
}

type StartBattleRequest = {
  playerId: string
  monsterId: string
}

class BattleApplicationService {
  async startBattle(request: StartBattleRequest): Promise<BattleAppStateEntity> {
    // 入力値の検証
    if (!request.playerId || !request.monsterId) {
      throw new Error("Invalid request parameters")
    }

    // エンティティの取得（仮想的なリポジトリから）
    const player = await this.playerRepository.findById(request.playerId)
    const monster = await this.monsterRepository.findById(request.monsterId)

    if (!player || !monster) {
      throw new Error("Player or Monster not found")
    }

    // ドメインロジックの実行
    const battle = new BattleEntity({
      id: crypto.randomUUID(),
      player,
      monster,
      turn: 0,
      isFinished: false,
    })

    // 永続化
    await this.battleRepository.save(battle)

    return BattleAppStateEntity.fromBattleEntity(battle, "戦闘を開始しました")
  }
}
```

Application Serviceは以下の責務を持ちます：

- 入力値の検証
- 必要なEntityの取得
- ドメインロジックの実行
- 永続化処理
- AppStateEntityとしての返り値の構築

より複雑な戦闘実行処理を考えます。

```ts
type ExecuteAttackRequest = {
  battleId: string
  actionType: "attack" | "heal"
}

class BattleApplicationService {
  async executeAttack(request: ExecuteAttackRequest): Promise<BattleAppStateEntity> {
    // 戦闘状態の取得
    const battle = await this.battleRepository.findById(request.battleId)
    
    if (!battle) {
      throw new Error("Battle not found")
    }

    if (battle.isFinished) {
      throw new Error("Battle is already finished")
    }

    // ドメインロジックの実行
    let updatedBattle: BattleEntity
    let actionMessage: string

    if (request.actionType === "attack") {
      updatedBattle = battle.castFireball()
      actionMessage = "ファイアボールを詠唱しました"
    } else {
      updatedBattle = battle.castHeal()
      actionMessage = "回復魔法を使用しました"
    }

    // ターン処理
    updatedBattle = updatedBattle.nextTurn()

    // 永続化
    await this.battleRepository.save(updatedBattle)

    // 戦闘終了メッセージの追加
    if (updatedBattle.isFinished) {
      const winner = updatedBattle.player.isDead ? "モンスター" : "プレイヤー"
      actionMessage += ` - ${winner}の勝利です`
    }

    return BattleAppStateEntity.fromBattleEntity(updatedBattle, actionMessage)
  }
}
```

Application Serviceにより、外部インターフェース（REST API、CLI、UI等）とドメインロジックが分離されます。同じドメインロジックを異なるインターフェースから利用できるようになります。

複数のドメインサービスを組み合わせる場合の例です。

```ts
import { BattleService } from "./domain/services/battle-service"
import { LevelingService } from "./domain/services/leveling-service"
import { ExpEngine } from "./domain/modules/exp-engine"

const zQuestAppStateProps = z.object({
  questId: z.string(),
  playerId: z.string(),
  status: z.enum(["completed", "failed"]),
  playerLevel: z.number(),
  expGained: z.number(),
  message: z.string(),
})

class QuestAppStateEntity {
  readonly questId!: string
  readonly playerId!: string
  readonly status!: "completed" | "failed"
  readonly playerLevel!: number
  readonly expGained!: number
  readonly message!: string

  constructor(props: z.infer<typeof zQuestAppStateProps>) {
    Object.assign(this, zQuestAppStateProps.parse(props))
    Object.freeze(this)
  }
}

class GameApplicationService {
  constructor(
    private battleService: BattleService,
    private levelingService: LevelingService,
    private expEngine: ExpEngine
  ) {}

  async completeQuest(request: { playerId: string; questId: string }): Promise<null | Error> {
    // プレイヤーとクエスト情報の取得
    const player = await this.playerRepository.findById(request.playerId)
    
    const quest = await this.questRepository.findById(request.questId)

    if (!player || !quest) {
      throw new Error("Player or Quest not found")
    }

    // 戦闘処理
    const battleResult = this.battleService.executeQuest(player, quest.monsters)
    
    // 経験値処理
    const updatedPlayer = this.levelingService.addExp(
      battleResult.player, 
      quest.expReward
    )

    // 永続化
    await this.playerRepository.save(updatedPlayer)
    
    await this.questRepository.markCompleted(quest.id, request.playerId)

    return null
  }
}
```

Application Serviceは、ドメインロジックを組み合わせてアプリケーションの機能を実現します。AppStateEntityを使用することで、UIやAPIの詳細を知る必要がなく、純粋にアプリケーションの動作に集中できます。

AppStateEntityの利点：

- 型安全な返り値の保証
- アプリケーション層での一貫した状態表現
- UIコンポーネントとの疎結合
- テストしやすい構造

## T | Error

下書き

```ts
const battleResult = this.battleService.executeQuest(player, quest.monsters)

if (battleResult instanceof Error) {
  return new ApplicationError("Battle failed")
}
```

## Reducer

下書き

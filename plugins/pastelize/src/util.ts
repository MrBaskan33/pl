import { findByName } from "@vendetta/metro"
import { ReactNative, chroma } from "@vendetta/metro/common"

const MurmurHashV3 = findByName("MurmurHashV3")

export function pastelize(
  input: string,
  sat: number = 0.75,
  val: number = 0.6
): number {
  const hue = MurmurHashV3(input) % 360
  const color = chroma.hsl(hue, sat, val)

  return ReactNative.processColor(color.toString()) as number
}

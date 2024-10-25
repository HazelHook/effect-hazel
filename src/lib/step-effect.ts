import { Effect } from "effect"
import { executeRpcWithCleanup } from "./hot-fix"

export const stepEffect = <A, E>(
	step: { do: (name: string, fn: () => Promise<any>) => Promise<any> },
	stepName: string,
	effectFn: Effect.Effect<A, E, never>,
): Effect.Effect<A, E, never> => {
	return Effect.promise(() => executeRpcWithCleanup(() => step.do(stepName, async () => Effect.runPromise(effectFn))))
}

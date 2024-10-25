import { Effect } from "effect"

export const stepEffect = <A, E>(
	step: { do: (name: string, fn: () => Promise<any>) => Promise<any> },
	stepName: string,
	effectFn: Effect.Effect<A, E, never>,
): Effect.Effect<A, E, never> => {
	return Effect.promise(() => step.do(stepName, async () => Effect.runPromise(effectFn)))
}

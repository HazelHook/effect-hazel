import { Data } from "effect"

export class ProviderNotFoundError extends Data.TaggedError("ProviderNotFoundError")<{
	message: string
	provider: string
}> {
	constructor(provider: string) {
		super({ message: `Provider "${provider}" not found.`, provider })
	}
}

export class CollectionNotFoundError extends Data.TaggedError("CollectionNotFoundError")<{
	message: string
	collection: string
	provider: string
}> {
	constructor(provider: string, collection: string) {
		super({ message: `Collection "${collection}" not found for provider ${provider}.`, collection, provider })
	}
}

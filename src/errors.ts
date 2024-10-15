import { Data } from "effect"

export class ProviderNotFoundError extends Data.TaggedError("ProviderNotFoundError")<{
	message: string
	provider: string
}> {
	constructor(provider: string) {
		super({ message: `Provider "${provider}" not found.`, provider })
	}
}

export class ResourceNotFoundError extends Data.TaggedError("CollectionNotFoundError")<{
	message: string
	resourceKey: string
	providerKey: string
}> {
	constructor(providerKey: string, resourceKey: string) {
		super({ message: `Resource "${resourceKey}" not found for provider ${providerKey}.`, providerKey, resourceKey })
	}
}

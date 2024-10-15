import { Data } from "effect"

export class ChildJobError extends Data.TaggedError("ChildJobError") {}

export class ProviderNotFoundError extends Data.TaggedError("ProviderNotFoundError")<{
	message: string
	provider: string
}> {
	constructor(provider: string) {
		super({ message: `Provider "${provider}" not found.`, provider })
	}
}

export class ResourceNotFoundError extends Data.TaggedError("ResourceNotFoundError")<{
	message: string
	resourceKey: string
	providerKey: string
}> {
	constructor(providerKey: string, resourceKey: string) {
		super({ message: `Resource "${resourceKey}" not found for provider ${providerKey}.`, providerKey, resourceKey })
	}
}

export class CollectionNotFoundError extends Data.TaggedError("CollectionNotFoundError")<{
	message: string
	collectionId: string
}> {
	constructor(collectionId: string) {
		super({ message: `Collection "${collectionId}" not found.`, collectionId })
	}
}

/**
 * Executes an RPC call and ensures proper cleanup.
 * @param {Function} rpcCall - A function that performs the RPC call.
 * @returns {Promise<any>} - The result of the RPC call.
 */
export async function executeRpcWithCleanup(rpcCall: () => Promise<any>): Promise<any> {
	let rpcResult = null
	try {
		rpcResult = await rpcCall()
		return rpcResult
	} finally {
		if (rpcResult && typeof rpcResult[Symbol.dispose] === "function") {
			console.info("Disposing RPC result")
			rpcResult[Symbol.dispose]()
		} else {
			console.info("No Symbol.dispose method on rpcResult")
		}
	}
}

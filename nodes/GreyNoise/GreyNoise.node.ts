import {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
	NodeApiError,
	NodeConnectionTypes,
} from 'n8n-workflow';

/**
 * postReceive hook to handle API errors returned in the response body
 */
export async function handleApiError(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const body = response.body as IDataObject;

	// Check for error message in response
	if (body.message && typeof body.message === 'string') {
		const message = body.message.toLowerCase();
		if (
			message.includes('unauthorized') ||
			message.includes('forbidden') ||
			message.includes('invalid') ||
			message.includes('error')
		) {
			throw new NodeApiError(this.getNode(), response as unknown as JsonObject, {
				message: body.message as string,
				description: 'The GreyNoise API returned an error. Check your API key and permissions.',
			});
		}
	}

	// Check for error field
	if (body.error) {
		throw new NodeApiError(this.getNode(), response as unknown as JsonObject, {
			message: (body.error as string) || 'API Error',
			description: body.message as string,
		});
	}

	// Check HTTP status code
	if (response.statusCode >= 400) {
		throw new NodeApiError(this.getNode(), response as unknown as JsonObject, {
			message: `HTTP Error ${response.statusCode}`,
			description: (body.message as string) || 'Request failed',
		});
	}

	return items;
}

/**
 * preSend hook to convert comma-separated IP string to array for bulk operations
 * This function handles quick mode logic for backwards compatibility:
 * - V1 ipMultiQuick operation: always quick
 * - V1 ipMultiConext operation: never quick
 * - V2 ipMultiLookup operation: uses quickMode toggle
 */
export async function buildIPArray(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const ips = this.getNodeParameter('ips') as string;
	const operation = this.getNodeParameter('operation') as string;

	// Quick mode logic for backwards compatibility with V1 operations
	let isQuick = operation === 'ipMultiQuick';
	if (operation === 'ipMultiLookup') {
		isQuick = this.getNodeParameter('quickMode', false) as boolean;
	}

	requestOptions.body = {
		ips: ips.split(',').map((ip) => ip.trim()),
	};

	// Quick mode is passed as query parameter, same as single IP lookup
	if (isQuick) {
		requestOptions.qs = requestOptions.qs || {};
		requestOptions.qs.quick = true;
	}

	return requestOptions;
}

/**
 * preSend hook to add quick parameter for single IP lookup
 */
export async function addQuickParam(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const quickMode = this.getNodeParameter('quickMode', false) as boolean;

	if (quickMode) {
		requestOptions.qs = requestOptions.qs || {};
		requestOptions.qs.quick = true;
	}

	return requestOptions;
}

/**
 * preSend hook to convert comma-separated CVE string to array for bulk operations
 */
export async function buildCVEArray(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const cves = this.getNodeParameter('cves') as string;

	requestOptions.body = {
		cves: cves.split(',').map((cve) => cve.trim()),
	};

	return requestOptions;
}

/**
 * postReceive hook to split root-level array into separate items
 * For APIs that return a bare array like [{item1}, {item2}]
 */
export async function splitRootArray(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const body = response.body;

	if (Array.isArray(body)) {
		return (body as IDataObject[]).map((item) => ({ json: item }));
	}

	return items;
}

export class GreyNoise implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GreyNoise',
		name: 'greyNoise',
		icon: {
			light: 'file:../../icons/greynoise.svg',
			dark: 'file:../../icons/greynoise.dark.svg',
		},
		group: ['transform'],
		version: [1, 2],
		defaultVersion: 2,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Query IPs against GreyNoise threat intelligence',
		defaults: {
			name: 'GreyNoise',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'greyNoiseApi',
				required: false,
			},
		],
		requestDefaults: {
			baseURL: 'https://api.greynoise.io',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			// ==================== VERSION 2: RESOURCE SELECTOR ====================
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Community',
						value: 'community',
					},
					{
						name: 'Enterprise',
						value: 'enterprise',
					},
				],
				default: 'community',
				displayOptions: {
					show: {
						'@version': [2],
					},
				},
			},

			// ==================== VERSION 2: COMMUNITY OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						'@version': [2],
						resource: ['community'],
					},
				},
				options: [
					{
						name: 'Community IP',
						value: 'ipCommunity',
						action: 'Free community IP lookup',
						description: 'Query IPs in the GreyNoise dataset (free, limited rate)',
						routing: {
							request: {
								method: 'GET',
								url: '=/v3/community/{{$parameter.ip}}',
								ignoreHttpStatusErrors: true,
							},
						},
					},
				],
				default: 'ipCommunity',
			},

			// ==================== VERSION 2: ENTERPRISE OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						'@version': [2],
						resource: ['enterprise'],
					},
				},
			options: [
					{
						name: 'CVE Lookup',
						value: 'cveLookup',
						action: 'Look up CVE information',
						description: 'Get vulnerability details for a CVE',
						routing: {
							request: {
								method: 'GET',
								url: '=/v1/cve/{{$parameter.cve}}',
								ignoreHttpStatusErrors: true,
							},
							output: {
								postReceive: [handleApiError],
							},
						},
					},
					{
						name: 'Multi-CVE Lookup',
						value: 'cveMultiLookup',
						// eslint-disable-next-line n8n-nodes-base/node-param-operation-option-action-miscased
						action: 'Look up multiple CVEs',
						description: 'Bulk CVE lookup for up to 10,000 CVEs',
						routing: {
							request: {
								method: 'POST',
								url: '/v3/cves',
								ignoreHttpStatusErrors: true,
							},
							send: {
								preSend: [buildCVEArray],
							},
							output: {
								postReceive: [handleApiError, splitRootArray],
							},
						},
					},
					{
						name: 'GNQL Query',
						value: 'gnqlQuery',
						action: 'Search NOISE dataset using GNQL',
						description: 'Search NOISE dataset using GreyNoise Query Language',
						routing: {
							request: {
								method: 'GET',
								url: '/v3/gnql',
								ignoreHttpStatusErrors: true,
							},
							output: {
								postReceive: [
									handleApiError,
									{
										type: 'rootProperty',
										properties: {
											property: 'data',
										},
									},
								],
							},
						},
					},
					{
						name: 'GNQL Stats',
						value: 'gnqlStats',
						action: 'Get aggregate statistics for query',
						description: 'Get aggregate statistics for query results',
						routing: {
							request: {
								method: 'GET',
								url: '/v2/experimental/gnql/stats', // No v3 replacement available
								ignoreHttpStatusErrors: true,
							},
							output: {
								postReceive: [handleApiError],
							},
						},
					},
					{
						name: 'IP Lookup',
						value: 'ipLookup',
						action: 'Look up an IP address',
						description: 'Get IP enrichment data including metadata, tags, and activity',
						routing: {
							request: {
								method: 'GET',
								url: '=/v3/ip/{{$parameter.ip}}',
								ignoreHttpStatusErrors: true,
							},
							send: {
								preSend: [addQuickParam],
							},
							output: {
								postReceive: [handleApiError],
							},
						},
					},
					{
						name: 'Multi-IP Lookup',
						value: 'ipMultiLookup',
						action: 'Look up multiple IP addresses',
						description: 'Bulk IP lookup for up to 10,000 IPs',
						routing: {
							request: {
								method: 'POST',
								url: '/v3/ip/',
								ignoreHttpStatusErrors: true,
							},
							send: {
								preSend: [buildIPArray],
							},
							output: {
								postReceive: [
									handleApiError,
									{
										type: 'rootProperty',
										properties: {
											property: 'data',
										},
									},
								],
							},
						},
					},
					{
						name: 'Tag Metadata',
						value: 'tagMetadata',
						action: 'Get list of all tags',
						description: 'Get list of all tags and their metadata',
						routing: {
							request: {
								method: 'GET',
								url: '/v3/tags',
								ignoreHttpStatusErrors: true,
							},
							output: {
								postReceive: [handleApiError],
							},
						},
					},
				],
				default: 'ipLookup',
			},

			// ==================== VERSION 1: FLAT OPERATION LIST (BACKWARDS COMPAT) ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						'@version': [1],
					},
				},
				options: [
					// Community
					{
						name: 'Community IP',
						value: 'ipCommunity',
						action: 'Free community IP lookup',
						description: 'Query IPs in the GreyNoise dataset (free, limited rate)',
						routing: {
							request: {
								method: 'GET',
								url: '=/v3/community/{{$parameter.ip}}',
								ignoreHttpStatusErrors: true,
							},
						},
					},
					// Enterprise - Single IP
					{
						name: 'IP Context',
						value: 'ipContext',
						action: 'Get complete IP enrichment data',
						description:
							'Get complete IP enrichment data including metadata, tags, and activity',
						routing: {
							request: {
								method: 'GET',
								url: '=/v3/ip/{{$parameter.ip}}',
								ignoreHttpStatusErrors: true,
							},
							output: {
								postReceive: [handleApiError],
							},
						},
					},
					{
						name: 'IP Quick Check',
						value: 'ipQuick',
						action: 'Fast lookup with minimal response',
						description: 'Fast lookup with minimal response payload',
						routing: {
							request: {
								method: 'GET',
								url: '=/v3/ip/{{$parameter.ip}}',
								qs: {
									quick: true,
								},
								ignoreHttpStatusErrors: true,
							},
							output: {
								postReceive: [handleApiError],
							},
						},
					},
					{
						name: 'RIOT IP Lookup',
						value: 'ipRiot',
						action: 'Check if IP is from known benign service',
						description:
							'Check if IP is from known benign service (CDN, cloud provider, scanner)',
						routing: {
							request: {
								method: 'GET',
								url: '=/v3/ip/{{$parameter.ip}}',
								ignoreHttpStatusErrors: true,
							},
							output: {
								postReceive: [handleApiError],
							},
						},
					},
					// Enterprise - Multi IP
					{
						name: 'Multi-IP Context',
						value: 'ipMultiConext', // Preserve original typo!
						action: 'Bulk IP lookup with full context',
						description: 'Bulk IP lookup with full context for up to 10,000 IPs',
						routing: {
							request: {
								method: 'POST',
								url: '/v3/ip/',
								ignoreHttpStatusErrors: true,
							},
							send: {
								preSend: [buildIPArray],
							},
							output: {
								postReceive: [
									handleApiError,
									{
										type: 'rootProperty',
										properties: {
											property: 'data',
										},
									},
								],
							},
						},
					},
					{
						name: 'Multi-IP Quick Check',
						value: 'ipMultiQuick',
						action: 'Bulk IP lookup with quick response',
						description: 'Bulk IP lookup with quick response for up to 10,000 IPs',
						routing: {
							request: {
								method: 'POST',
								url: '/v3/ip/',
								ignoreHttpStatusErrors: true,
							},
							send: {
								preSend: [buildIPArray],
							},
							output: {
								postReceive: [
									handleApiError,
									{
										type: 'rootProperty',
										properties: {
											property: 'data',
										},
									},
								],
							},
						},
					},
					// Enterprise - GNQL
					{
						name: 'GNQL Query',
						value: 'gnqlQuery',
						action: 'Search NOISE dataset using GNQL',
						description: 'Search NOISE dataset using GreyNoise Query Language',
						routing: {
							request: {
								method: 'GET',
								url: '/v3/gnql',
								ignoreHttpStatusErrors: true,
							},
							output: {
								postReceive: [
									handleApiError,
									{
										type: 'rootProperty',
										properties: {
											property: 'data',
										},
									},
								],
							},
						},
					},
					{
						name: 'GNQL Stats',
						value: 'gnqlStats',
						action: 'Get aggregate statistics for query',
						description: 'Get aggregate statistics for query results',
						routing: {
							request: {
								method: 'GET',
								url: '/v2/experimental/gnql/stats', // No v3 replacement available
								ignoreHttpStatusErrors: true,
							},
							output: {
								postReceive: [handleApiError],
							},
						},
					},
					// Enterprise - Tags
					{
						name: 'Tag Metadata',
						value: 'tagMetadata',
						action: 'Get list of all tags',
						description: 'Get list of all tags and their metadata',
						routing: {
							request: {
								method: 'GET',
								url: '/v3/tags',
								ignoreHttpStatusErrors: true,
							},
							output: {
								postReceive: [handleApiError],
							},
						},
					},
				],
				default: 'ipCommunity',
			},

			// ==================== INPUT FIELDS ====================

			// --- Single IP Input (all single-IP operations, both versions) ---
			{
				displayName: 'IP',
				name: 'ip',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g., 8.8.8.8',
				description: 'IP address to query',
				displayOptions: {
					show: {
						operation: ['ipCommunity', 'ipContext', 'ipQuick', 'ipRiot', 'ipLookup'],
					},
				},
			},

			// --- Multi-IP Input ---
			{
				displayName: 'IPs',
				name: 'ips',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g., 8.8.8.8, 1.1.1.1, 9.9.9.9',
				description: 'Comma-separated list of IPs to query (up to 10,000)',
				displayOptions: {
					show: {
						operation: ['ipMultiConext', 'ipMultiQuick', 'ipMultiLookup'],
					},
				},
			},

			// --- Quick Mode Toggle (v2 only) ---
			{
				displayName: 'Quick Mode',
				name: 'quickMode',
				type: 'boolean',
				default: false,
				description: 'Whether to return a minimal response for faster lookups',
				displayOptions: {
					show: {
						'@version': [2],
						operation: ['ipLookup', 'ipMultiLookup'],
					},
				},
			},

			// --- CVE Input (v2 only) ---
			{
				displayName: 'CVE ID',
				name: 'cve',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g., CVE-2024-1234',
				description: 'CVE ID to query',
				displayOptions: {
					show: {
						'@version': [2],
						operation: ['cveLookup'],
					},
				},
			},

			// --- Multi-CVE Input (v2 only) ---
			{
				displayName: 'CVE IDs',
				name: 'cves',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g., CVE-2024-1234, CVE-2025-5678',
				description: 'Comma-separated list of CVE IDs to query (up to 10,000)',
				displayOptions: {
					show: {
						'@version': [2],
						operation: ['cveMultiLookup'],
					},
				},
			},

			// --- GNQL Query Input ---
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g., classification:malicious tags:mirai',
				description: 'GNQL query string',
				displayOptions: {
					show: {
						operation: ['gnqlQuery', 'gnqlStats'],
					},
				},
				routing: {
					send: {
						type: 'query',
						property: 'query',
					},
				},
			},

			// --- GNQL Size Parameter ---
			{
				displayName: 'Limit',
				name: 'size',
				type: 'number',
				default: 50,
				description: 'Max number of results to return',
				typeOptions: {
					minValue: 1,
					maxValue: 10000,
				},
				displayOptions: {
					show: {
						operation: ['gnqlQuery'],
					},
				},
				routing: {
					send: {
						type: 'query',
						property: 'size',
					},
				},
			},

			// --- GNQL Stats Count Parameter ---
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 50,
				description: 'Number of top aggregates to return',
				typeOptions: {
					minValue: 1,
					maxValue: 10000,
				},
				displayOptions: {
					show: {
						operation: ['gnqlStats'],
					},
				},
				routing: {
					send: {
						type: 'query',
						property: 'count',
					},
				},
			},
		],
	};
}

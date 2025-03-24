/* eslint-disable n8n-nodes-base/node-param-operation-option-action-miscased,n8n-nodes-base/node-class-description-icon-not-svg*/

import {
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType
} from 'n8n-workflow';

export async function buildIPArray(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const ips = this.getNodeParameter('ips') as string;
	// Create the ips array in the request body
	requestOptions.body = { ips: ips.split(',') };
	return requestOptions;
}

export class GreyNoise implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GreyNoise',
		name: 'greyNoise',
		icon: 'file:greynoise.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with GreyNoise API',
		defaults: {
			name: 'GreyNoise',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'greynoiseApi',
				required: false,
			},
		],
		requestDefaults: {
			baseURL: 'https://api.greynoise.io',
			url: '',
			// skipSslCertificateValidation: true,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		/**
		 * In the properties array we have two mandatory options objects required
		 *
		 * [Resource & Operation]
		 *
		 * https://docs.n8n.io/integrations/creating-nodes/code/create-first-node/#resources-and-operations
		 *
		 * In our example, the operations are separated into their own file (HTTPVerbDescription.ts)
		 * to keep this class easy to read.
		 *
		 */
		properties: [
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
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,

				displayOptions: {
					show: {
						resource: ['community'],
					},
				},
				options: [
					{
						name: 'Community IP',
						value: 'ipCommunity',
						action: 'Free community IP lookup',
						routing: {
							request: {
								// skipSslCertificateValidation: true,
								url: '=/v3/community/{{ $parameter.ip }}',
								ignoreHttpStatusErrors: true,
							},
						},
					},
				],
				default: 'ipCommunity',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,

				displayOptions: {
					show: {
						resource: ['enterprise'],
					},
				},
				options: [
					{
						name: 'GNQL Query',
						value: 'gnqlQuery',
						action: 'GNQL Query',
						hint: 'GNQL (GreyNoise Query Language) is a domain-specific query language that uses Lucene deep under the hood. GNQL aims to enable GreyNoise Enterprise and Research users to make complex and one-off queries against the GreyNoise dataset as new business cases arise.',
						routing: {
							request: {
								url: '=/v2/experimental/gnql',
								ignoreHttpStatusErrors: true,
							},
							output: {
								postReceive: [
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
						action: 'GNQL Stats',
						hint: 'Get aggregate statistics for the top organizations, actors, tags, ASNs, countries, classifications, and operating systems of all the results of a given GNQL query.',
						routing: {
							request: {
								url: '=/v2/experimental/gnql/stats',
								ignoreHttpStatusErrors: true,
							},
						},
					},
					// {
					// 	name: 'IP Context',
					// 	value: 'ipContext',
					// 	action: 'IP Context',
					// 	hint: 'Get more information about a given IP address. Returns time ranges, IP metadata (network owner, ASN, reverse DNS pointer, country), associated actors, activity tags, and raw port scan and web request information.',
					// 	routing: {
					// 		request: {
					// 			url: '=/v2/noise/context/{{ $parameter.ip }}',
					// 			ignoreHttpStatusErrors: true,
					// 		},
					// 	},
					// },
					// {
					// 	name: 'IP Quick Check',
					// 	value: 'ipQuick',
					// 	action: 'IP Quick Check',
					// 	hint: 'Check whether a given IP address is “Internet background noise”, or has been observed scanning or attacking devices across the Internet.',
					// 	routing: {
					// 		request: {
					// 			url: '=/v2/noise/quick/{{ $parameter.ip }}',
					// 			ignoreHttpStatusErrors: true,
					// 		},
					// 	},
					// },
					{
						name: 'IP Context',
						value: 'ipMultiConext',
						action: 'IP Context',
						hint: 'Get more information about a set of IP addresses. Returns time ranges, IP metadata (network owner, ASN, reverse DNS pointer, country), associated actors, activity tags, and raw port scan and web request information.',
						routing: {
							request: {
								method: 'POST',
								url: '/v2/noise/multi/context',
								ignoreHttpStatusErrors: true,
							},
						},
					},
					{
						name: 'IP Quick Check',
						value: 'ipMultiQuick',
						action: 'IP Quick Check',
						hint: 'Check whether a given IP address is “Internet background noise”, or has been observed scanning or attacking devices across the Internet.',
						routing: {
							request: {
								method: 'POST',
								url: '=/v2/noise/multi/quick',
								ignoreHttpStatusErrors: true,
							},
						},
					},
					{
						name: 'RIOT IP Lookup',
						value: 'ipRiot',
						action: 'RIOT IP Lookup',
						hint: 'RIOT identifies IPs from known benign services and organizations that commonly cause false positives in network security and threat intelligence products.',
						routing: {
							request: {
								url: '=/v2/riot/{{ $parameter.ip }}',
								ignoreHttpStatusErrors: true,
							},
						},
					},
					{
						name: 'Tag Metadata',
						value: 'tagMetadata',
						action: 'Get Tag Metadata',
						hint: 'Get a list of tags and their respective metadata',
						routing: {
							request: {
								url: '/v2/meta/metadata',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'metadata',
										},
									},
								],
							},
						},
					},
				],
				default: 'ipMultiConext',
			},
			{
				displayName: 'IP',
				description: 'IP to query',
				required: true,
				name: 'ip',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['ipCommunity', 'ipContext', 'ipQuick', 'ipRiot'],
					},
				},
			},
			{
				displayName: 'IPs',
				description: 'IPs to query',
				required: true,
				name: 'ips',
				type: 'string',
				default: '',
				hint: 'Comma separated list of IPs',
				displayOptions: {
					show: {
						operation: ['ipMultiConext', 'ipMultiQuick'],
					},
				},
				routing: {
					send: {
						preSend: [
							// Parse IPs into an array
							buildIPArray,
						],
						// value: '={{ $parameter.ips.split(",") }}',
						// property: 'ips',
						// type: 'body',
					},
				},
			},
			{
				displayName: 'Query',
				description: 'GNQL Query',
				required: true,
				name: 'query',
				type: 'string',
				default: '',
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
			// {
			// 	displayName: 'Return All',
			// 	name: 'returnAll',
			// 	type: 'boolean',
			// 	default: false,
			// 	description: 'Whether to return all results or only up to a given limit',
			// 	displayOptions: {
			// 		show: {
			// 			operation: [
			// 				'gnqlQuery',
			// 				'gnqlStats',
			// 			],
			// 		},
			// 	},
			// 	routing: {
			// 		send: {
			// 			paginate: true,
			// 		},
			// 		operations: {
			// 			pagination: {
			// 				type: 'offset',
			// 				properties: {
			// 					limitParameter: 'size',
			// 					offsetParameter: 'scroll',
			// 					pageSize: 1,
			// 					type: 'query',
			// 				},
			// 			},
			// 		},
			// 	}
			// },
			{
				displayName: 'Limit',
				description: 'Results to return',
				name: 'size',
				type: 'number',
				default: 50,
				typeOptions: {
					minValue: 1,
					maxValue: 10000,
				},
				displayOptions: {
					show: {
						operation: ['gnqlQuery'],
					},
					// hide: {
					// 	returnAll: [ true ],
					// }
				},
				routing: {
					send: {
						type: 'query',
						property: 'size',
					},
				},
			},
			{
				displayName: 'Count',
				description: 'Number of top aggregates to grab',
				name: 'count',
				type: 'number',
				default: 50,
				typeOptions: {
					minValue: 1,
					maxValue: 10000,
				},
				displayOptions: {
					show: {
						operation: ['gnqlStats'],
					},
					// hide: {
					// 	returnAll: [ true ],
					// }
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

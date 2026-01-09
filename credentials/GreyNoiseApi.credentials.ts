import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class GreyNoiseApi implements ICredentialType {
	name = 'greyNoiseApi';
	displayName = 'GreyNoise API';
	documentationUrl = 'https://docs.greynoise.io/docs/using-the-greynoise-community-api';
	icon: Icon = {
		light: 'file:../icons/greynoise.svg',
		dark: 'file:../icons/greynoise.dark.svg',
	};

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Your GreyNoise API key. Get one free at <a href="https://viz.greynoise.io/signup" target="_blank">viz.greynoise.io</a>.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				key: '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.greynoise.io',
			url: '/ping',
		},
	};
}

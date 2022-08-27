import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class GreyNoiseApi implements ICredentialType {
	name = 'greynoiseApi';
	displayName = 'GreyNoise API';
	documentationUrl = 'https://example.com';
	properties: INodeProperties[] = [
		{
			displayName: 'Token',
			name: 'token',
			type: 'string',
			default: '',
		},
	];

	// This allows the credential to be used by other parts of n8n
	// stating how this credential is injected as part of the request
	// An example is the Http Request node that can make generic calls
	// reusing this credential
	authenticate = {
		type: 'generic',
		properties: {
			headers: {
				key: '={{$credentials.token}}',
			},
		},
	} as IAuthenticateGeneric;

	// The block below tells how this credential can be tested
	test: ICredentialTestRequest = {
		request: {
			// skipSslCertificateValidation: true,
			baseURL: 'https://api.greynoise.io',
			url: '/ping',
		},
	};
}

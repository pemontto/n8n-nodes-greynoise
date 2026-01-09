<img src="https://raw.githubusercontent.com/pemontto/n8n-nodes-greynoise/master/icons/greynoise.svg" width="120" alt="GreyNoise Logo" />

# n8n-nodes-greynoise

This is an n8n community node for interacting with the [GreyNoise](https://viz.greynoise.io/) cybersecurity platform.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

- [Installation](#installation)
  - [Community Nodes (Recommended)](#community-nodes-recommended)
  - [Manual installation](#manual-installation)
- [Operations](#operations)
  - [Community](#community)
  - [Enterprise](#enterprise)
- [Credentials](#credentials)
- [Compatibility](#compatibility)
- [Resources](#resources)
- [License](#license)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Community Nodes (Recommended)

For users on n8n v0.187+, your instance owner can install this node from [Community Nodes](https://docs.n8n.io/integrations/community-nodes/installation/).

1. Go to **Settings > Community Nodes**.
2. Select **Install**.
3. Enter `n8n-nodes-greynoise` in **Enter npm package name**.
4. Agree to the [risks](https://docs.n8n.io/integrations/community-nodes/risks/) of using community nodes: select **I understand the risks of installing unverified code from a public source**.
5. Select **Install**.

After installing the node, you can use it like any other node. n8n displays the node in search results in the **Nodes** panel.

### Manual installation

To get started install the package in your n8n root directory:

`npm install n8n-nodes-greynoise`

For Docker-based deployments add the following line before the font installation command in your [n8n Dockerfile](https://github.com/n8n-io/n8n/blob/master/docker/images/n8n/Dockerfile):

`RUN cd /usr/local/lib/node_modules/n8n && npm install n8n-nodes-greynoise`

## Operations

### Community

- **Community IP**: Query IPs in the GreyNoise dataset (free, limited rate)

### Enterprise

- **IP Lookup**: Get IP enrichment data including metadata, tags, and activity
  - Optional **Quick Mode** for faster lookups with minimal response
- **Multi-IP Lookup**: Bulk IP lookup for up to 10,000 IPs
  - Optional **Quick Mode** for faster lookups with minimal response
- **GNQL Query**: Search the NOISE dataset using GreyNoise Query Language
- **GNQL Stats**: Get aggregate statistics for query results (top organizations, actors, tags, ASNs, countries, etc.)
- **Tag Metadata**: Get a list of all tags and their metadata

## Credentials

You can use the GreyNoise Community API without authentication, however you will be limited in the number of requests you can send. For more requests or enterprise functionality, [sign up](https://viz.greynoise.io/signup) for an account.

- **API Key**: Your GreyNoise API key

## Compatibility

n8n v0.187+

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE.md)

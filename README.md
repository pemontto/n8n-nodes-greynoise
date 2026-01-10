<img src="https://raw.githubusercontent.com/pemontto/n8n-nodes-greynoise/master/icons/greynoise.svg" width="120" alt="GreyNoise Logo" />

# n8n-nodes-greynoise

This is an n8n community node for [GreyNoise](https://www.greynoise.io/) threat intelligence. Query IP addresses to identify internet scanners, benign services, and malicious actors.

[n8n](https://n8n.io/) is a fair-code licensed workflow automation platform.

[Installation](#installation) |
[Operations](#operations) |
[Credentials](#credentials) |
[Resources](#resources)

## Installation

Install via **Settings > Community Nodes** in n8n and search for `n8n-nodes-greynoise`.

See the [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/installation/) for more details.

## Operations

### Community

- **Community IP**: Query IPs in the GreyNoise dataset (free, limited rate)

### Enterprise

- **CVE Lookup**: Get vulnerability details for a CVE
- **Multi-CVE Lookup**: Bulk CVE lookup for up to 10,000 CVEs
- **GNQL Query**: Search the NOISE dataset using GreyNoise Query Language
- **GNQL Stats**: Get aggregate statistics for query results (top organizations, actors, tags, ASNs, countries, etc.)
- **IP Lookup**: Get IP enrichment data including metadata, tags, and activity
  - Optional **Quick Mode** for faster lookups with minimal response
- **Multi-IP Lookup**: Bulk IP lookup for up to 10,000 IPs
  - Optional **Quick Mode** for faster lookups with minimal response
- **Tag Metadata**: Get a list of all tags and their metadata

## Credentials

You can use the GreyNoise Community API without authentication, however you will be limited in the number of requests you can send. For more requests or enterprise functionality, [sign up](https://viz.greynoise.io/signup) for an account.

- **API Key**: Your GreyNoise API key

## Compatibility

Tested with n8n v1.50+

## Resources

- [GreyNoise API Documentation](https://docs.greynoise.io/reference/get_v3-community-ip)
- [GNQL Query Language](https://docs.greynoise.io/reference/gnql-1)
- [GreyNoise Visualizer](https://viz.greynoise.io/) - Web interface and API key management
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE.md)

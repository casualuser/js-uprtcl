import { MicroOrchestrator, i18nextBaseModule } from '@uprtcl/micro-orchestrator';
import { LensesModule, LensSelectorPlugin, ActionsPlugin } from '@uprtcl/lenses';
import { DocumentsHttp, DocumentsIpfs, DocumentsModule } from '@uprtcl/documents';
import { WikisIpfs, WikisModule, WikisHttp } from '@uprtcl/wikis';
import { ApolloClientModule, GqlCortexModule, GqlDiscoveryModule } from '@uprtcl/common';
import { AccessControlModule } from '@uprtcl/access-control';
import { EveesModule, EveesEthereum, EveesHttp } from '@uprtcl/evees';
import { IpfsConnection, EthereumConnection, HttpConnection } from '@uprtcl/connections';

import { SimpleEditor } from './simple-editor';
import { SimpleWiki } from './simple-wiki';

(async function() {
  const c1host = 'http://localhost:3100/uprtcl/1';
  const ethHost = 'ws://localhost:8545';
  const ipfsConfig = { host: 'ipfs.infura.io', port: 5001, protocol: 'https' };

  const httpConnection = new HttpConnection();
  const ipfsConnection = new IpfsConnection(ipfsConfig);
  const ethConnection = new EthereumConnection({ provider: ethHost });

  const httpEvees = new EveesHttp(c1host, httpConnection);
  const ethEvees = new EveesEthereum(ethConnection, ipfsConnection);

  const httpDocuments = new DocumentsHttp(c1host, httpConnection);
  const ipfsDocuments = new DocumentsIpfs(ipfsConnection);

  const httpWikis = new WikisHttp(c1host, httpConnection);
  const ipfsWikis = new WikisIpfs(ipfsConnection);


  const eveesRemotesLinks = {
    [httpEvees.uprtclProviderLocator]: httpDocuments.uprtclProviderLocator,
    [ethEvees.uprtclProviderLocator]: ipfsDocuments.uprtclProviderLocator
  }

  const evees = new EveesModule([ethEvees, httpEvees], eveesRemotesLinks);

  const docsRemotesLinks = {
    [httpEvees.uprtclProviderLocator]: httpDocuments.uprtclProviderLocator,
    [ethEvees.uprtclProviderLocator]: ipfsDocuments.uprtclProviderLocator
  }

  const documents = new DocumentsModule([ipfsDocuments, httpDocuments], docsRemotesLinks);

  const wikiRemotesLinks = {
    [httpEvees.uprtclProviderLocator]: httpWikis.uprtclProviderLocator,
    [ethEvees.uprtclProviderLocator]: ipfsWikis.uprtclProviderLocator,
    [httpWikis.uprtclProviderLocator]: httpDocuments.uprtclProviderLocator,
    [ipfsWikis.uprtclProviderLocator]: ipfsDocuments.uprtclProviderLocator
  }

  const wikis = new WikisModule([ipfsWikis, httpWikis], wikiRemotesLinks);

  const lenses = new LensesModule({
    'lens-selector': new LensSelectorPlugin(),
    actions: new ActionsPlugin()
  });

  const modules = [
    new i18nextBaseModule(),
    new ApolloClientModule(),
    new GqlCortexModule(),
    new GqlDiscoveryModule(),
    lenses,
    new AccessControlModule(),
    evees,
    documents,
    wikis
  ];

  const orchestrator = new MicroOrchestrator();

  await orchestrator.loadModules(modules);

  console.log(orchestrator);
  customElements.define('simple-editor', SimpleEditor);
  customElements.define('simple-wiki', SimpleWiki);
})();

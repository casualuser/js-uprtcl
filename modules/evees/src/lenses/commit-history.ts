import { Dictionary } from 'lodash';
import { LitElement, property, html, css } from 'lit-element';

import { reduxConnect } from '@uprtcl/micro-orchestrator';
import { Hashed } from '@uprtcl/cortex';
import { LensElement } from '@uprtcl/lenses';
import { Secured, GraphQlTypes } from '@uprtcl/common';

import { Commit } from '../types';
import { ApolloClient, gql } from 'apollo-boost';

interface CommitHistoryData {
  id: string;
  entity: {
    message: string;
    timestamp: number;
    parentCommits: Array<CommitHistoryData>;
  };
}

export class CommitHistory extends reduxConnect(LitElement)
  implements LensElement<Secured<Commit>> {
  @property({ type: Object })
  data!: Secured<Commit>;

  @property({ type: Object })
  commitHistory: CommitHistoryData | undefined;

  async firstUpdated() {
    this.loadCommitHistory();
  }

  async loadCommitHistory() {
    this.commitHistory = undefined;

    const apolloClient: ApolloClient<any> = this.request(GraphQlTypes.Client);
    const result = await apolloClient.query({
      query: gql`
      {
        getEntity(id: "${this.data.id}", depth: 1) {
          id
          entity {
            ... on Commit {
              message
              timestamp
              parentCommits {
                id
                entity {
                  ... on Commit {
                    message
                    timestamp
                    parentCommits {
                      id
                      entity {
                        ... on Commit {
                          timestamp
                          message
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `
    });

    this.commitHistory = result.data.getEntity;
  }

  renderCommitHistory(commitHistory: CommitHistoryData) {
    return html`
      <div class="column">
        ${commitHistory.id} ${commitHistory.entity.message} ${commitHistory.entity.timestamp}
        ${commitHistory.entity.parentCommits
          ? html`
              <div class="row">
                ${commitHistory.entity.parentCommits.map(parent =>
                  this.renderCommitHistory(parent)
                )}
              </div>
            `
          : html``}
      </div>
    `;
  }

  render() {
    return html`
      <div class="row">
        ${this.commitHistory ? this.renderCommitHistory(this.commitHistory) : html``}
        <slot name="plugins"></slot>
      </div>
    `;
  }

  static get styles() {
    return css`
      .column {
        display: flex;
        flex-direction: column;
      }

      .row {
        display: flex;
        flex-direction: row;
      }
    `;
  }
}

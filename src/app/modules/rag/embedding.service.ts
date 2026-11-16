import { envConfig } from '../../config'

export class EmbeddingService {
  private apiKey: string
  private apiUrl: string = 'https://openrouter.ai/api/v1'
  private embeddingModel: string

  constructor() {
    this.apiKey = envConfig.OPENROUTER_API_KEY || ''
    this.embeddingModel =
      envConfig.OPENROUTER_EMBEDDING_MODEL ||
      'nvidia/nemotron-3.5-embed-1b:free'
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set in .env')
    }
  }

  async generateEmbedding(text: string) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.embeddingModel,
          input: text
        })
      })

      const data = await response.json()

      if (!data.data || data.data.length == 0) {
        throw new Error('No embedding data returned')
      }

      return data.data[0].embedding
    } catch (error) {
      console.log(error)
    }
  }
}

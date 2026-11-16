/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from '../../../../generated/prisma/client'
import { prisma } from '../../lib/prisma'
import { EmbeddingService } from './embedding.service'
import { IndexingService } from './indexing.service'
import { LLMService } from './llm.service'

export class RagService {
  private embeddingService: EmbeddingService
  private llmService: LLMService
  private indexingService: IndexingService

  constructor() {
    this.embeddingService = new EmbeddingService()
    this.llmService = new LLMService()
    this.indexingService = new IndexingService()
  }

  async ingestDoctor() {
    await this.indexingService.indexDoctorData()
  }

  async retrieveDocuments(query: string, limit: number, sourceType?: string) {
    try {
      const embedding = await this.embeddingService.generateEmbedding(query)

      const vectorLiteral = `[${embedding.join(',')}]`

      const result = await prisma.$queryRaw(Prisma.sql`
      SELECT
        id,
        "chunkKey",
        "sourceType",
        "sourceId",
        "sourceLabel",
        content,
        metadata,
        1 - (embedding <=> CAST(${vectorLiteral} AS vector)) AS similarity
      FROM "document_embeddings"
      WHERE "isDeleted" = false
      ${sourceType ? Prisma.sql`AND "sourceType" = ${sourceType}` : Prisma.empty}
      ORDER BY embedding <=> CAST(${vectorLiteral} AS vector)
      LIMIT ${limit}
    `)

      return result
    } catch (error) {
      console.error('Document retrieval failed:', error)
      throw error
    }
  }

  async generateAnswer(
    query: string,
    limit: number = 5,
    sourceType: string,
    asJson: boolean
  ) {
    try {
      const retrieveDocs = await this.retrieveDocuments(
        query,
        limit,
        sourceType
      )

      const content = (retrieveDocs as any[])
        .filter((item) => item.content)
        .map((item) => item.content)

      let answer = await this.llmService.generateResponse(
        query,
        content,
        asJson
      )

      let parsedAnswer: any = answer

      if (asJson) {
        try {
          if (answer.startsWith('```json')) {
            answer = answer
              .replace(/```json\n?/, '')
              .replace(/```$/, '')
              .trim()
          } else if (answer.startsWith('```')) {
            answer = answer
              .replace(/```\n?/, '')
              .replace(/```$/, '')
              .trim()
          }
          parsedAnswer = JSON.parse(answer)
        } catch (e) {
          console.error('Failed to parse LLM JSON response:', e)
          throw e
        }
      }

      return {
        answer: parsedAnswer,
        sources: (retrieveDocs as any).map((doc: any) => ({
          id: doc.id,
          chunkKey: doc.chunkKey,
          sourceType: doc.sourceType,
          sourceId: doc.sourceId,
          sourceLabel: doc.sourceLabel,
          content: doc.content,
          similarity: doc.similarity
        })),
        contextUsed: content.length > 0
      }
    } catch (error) {
      console.log(error)
    }
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from '../../../../generated/prisma/client'
import { prisma } from '../../lib/prisma'
import { EmbeddingService } from './embedding.service'

const toVectorLiteral = (vector: number[]) => `[${vector.join(',')}]`

export class IndexingService {
  private embeddingService: EmbeddingService

  constructor() {
    this.embeddingService = new EmbeddingService()
  }

  async indexingDocument(
    chunkKey: string,
    sourceId: string,
    sourceType: string,
    sourceLabel: string,
    content: string,
    metadata: Record<string, any>
  ) {
    const embedding = await this.embeddingService.generateEmbedding(content)
    const vectorLiteral = toVectorLiteral(embedding)

    await prisma.$executeRaw(Prisma.sql`
        INSERT INTO "document_embeddings"
        (
            "id",
            "chunkKey",
            "sourceId",
            "sourceType",
            "sourceLabel",
            "content",
            "metadata",
            "embedding",
            "updatedAt"
        ) VALUES (
            ${Prisma.raw('gen_random_uuid()')},
            ${chunkKey},
            ${sourceId},
            ${sourceType},
            ${sourceLabel},
            ${content},
            ${JSON.stringify(metadata)},
            CAST(${vectorLiteral} AS vector),
            NOW()
        )
        ON CONFLICT ("chunkKey") 
        DO UPDATE SET
        "sourceType" = EXCLUDED."sourceType",
          "sourceId" = EXCLUDED."sourceId",
          "sourceLabel" = EXCLUDED."sourceLabel",
          "content" = EXCLUDED."content",
          "metadata" = EXCLUDED."metadata",
          "embedding" = EXCLUDED."embedding",
          "isDeleted" = false,
          "deletedAt" = null,
          "updatedAt" = NOW()
        `)
  }

  async indexDoctorData() {
    try {
      const doctors = await prisma.doctor.findMany({
        where: {
          isDeleted: false
        },
        include: {
          doctorSpecialties: {
            include: {
              specialty: true
            }
          },
          reviews: true
        }
      })
      let indexCount = 0

      for (const doctor of doctors) {
        const specialtiesList = doctor.doctorSpecialties
          .map((item) => item.specialty.title)
          .join('\n')
        const reviewsText = doctor.reviews.map(
          (r) => `- Rating: ${r.rating}/5. Comment: ${r.comment}||"No comment"`
        )

        const content = `Doctor Name: ${doctor.name}
            Experience: ${doctor.experience} years
            Qualification: ${doctor.qualifications}
            Designation: ${doctor.designation}
            Appointment Fee: $${doctor.appointmentFee}
            Current Working Place: ${doctor.currentWorkplace}
            Average Rating: ${doctor.averageRating}/5
            Specialties: ${specialtiesList || 'None listed'}

            Patient Reviews:
            ${reviewsText || 'No reviews yet.'}`

        const metadata = {
          doctorId: doctor.id,
          name: doctor.name,
          specialties: doctor.doctorSpecialties.map((ds) => ds.specialty.title),
          averageRating: doctor.averageRating,
          experience: doctor.experience
        }

        const chunkKey = `doctor-${doctor.id}`

        await this.indexingDocument(
          chunkKey,
          doctor.id,
          'DOCTOR',
          doctor.name,
          content,
          metadata
        )
        indexCount++
      }
      console.log(`Successfully Indexed ${indexCount} doctors.`)
    } catch (error) {
      console.log(error)
    }
  }
}

import type { Prisma, UnansweredQuestion, Property } from '#generated/client.js';
import prisma from '../../config/prisma.js';
import { createServiceError } from '../../utils/helpers/serviceError.js';
import { notDeleted } from '../../utils/helpers/softDelete.js';
import {
  parseSessionMemory,
  sessionMemoryToJson,
  upsertMemoryFact,
} from '../../services/ai/tools/sessionMemory.js';
import type { AnswerQuestionDtoType, CreateQuestionInput } from './dto/lister.dto.js';
import type {
  AnswerQuestionResult,
  CreateQuestionResult,
  SafeUnansweredQuestion,
} from './types/lister.types.js';

type QuestionWithProperty = UnansweredQuestion & {
  property: Pick<Property, 'id' | 'title' | 'slug' | 'suburb' | 'listerId'>;
};

export class ListerService {
  private toSafeQuestion(question: QuestionWithProperty): SafeUnansweredQuestion {
    let canonicalAttributes: string[] | null = null;
    if (Array.isArray(question.canonicalAttributes)) {
      const attrs: string[] = [];
      for (const item of question.canonicalAttributes) {
        if (typeof item === 'string') {
          attrs.push(item);
        }
      }
      canonicalAttributes = attrs.length > 0 ? attrs : null;
    }

    return {
      id: question.id,
      propertyId: question.propertyId,
      sessionId: question.sessionId,
      status: question.status,
      questionText: question.questionText,
      resolvedIntent: question.resolvedIntent,
      canonicalAttributes,
      answerText: question.answerText,
      answeredAt: question.answeredAt ? question.answeredAt.toISOString() : null,
      createdAt: question.createdAt.toISOString(),
      property: {
        id: question.property.id,
        title: question.property.title,
        slug: question.property.slug,
        suburb: question.property.suburb,
      },
    };
  }

  async listQuestionsForLister(listerId: string): Promise<SafeUnansweredQuestion[]> {
    const questions = await prisma.unansweredQuestion.findMany({
      where: {
        ...notDeleted(),
        property: { listerId, ...notDeleted() },
      },
      include: {
        property: { select: { id: true, title: true, slug: true, suburb: true, listerId: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    return questions.map((question) => this.toSafeQuestion(question));
  }

  async createQuestion(input: CreateQuestionInput): Promise<CreateQuestionResult> {
    const property = await prisma.property.findFirst({
      where: { id: input.propertyId, ...notDeleted() },
    });

    if (!property) {
      throw createServiceError(404, 'Property not found');
    }

    const existingOpen = await prisma.unansweredQuestion.findFirst({
      where: {
        propertyId: input.propertyId,
        status: 'OPEN',
        questionText: input.questionText,
        ...notDeleted(),
      },
    });

    if (existingOpen) {
      return {
        questionId: existingOpen.id,
        status: existingOpen.status,
        delivered: true,
      };
    }

    const canonicalAttributesJson: Prisma.InputJsonValue | undefined =
      input.canonicalAttributes && input.canonicalAttributes.length > 0
        ? input.canonicalAttributes
        : undefined;

    const question = await prisma.unansweredQuestion.create({
      data: {
        propertyId: input.propertyId,
        sessionId: input.sessionId,
        userId: input.userId,
        questionText: input.questionText,
        resolvedIntent: input.resolvedIntent,
        canonicalAttributes: canonicalAttributesJson,
      },
    });

    return {
      questionId: question.id,
      status: question.status,
      delivered: true,
    };
  }

  async answerQuestion(
    listerId: string,
    questionId: string,
    dto: AnswerQuestionDtoType,
  ): Promise<AnswerQuestionResult> {
    const question = await prisma.unansweredQuestion.findFirst({
      where: { id: questionId, ...notDeleted() },
      include: {
        property: { select: { id: true, title: true, slug: true, suburb: true, listerId: true } },
      },
    });

    if (!question || question.property.listerId !== listerId) {
      throw createServiceError(404, 'Question not found or access denied');
    }

    const canonicalAttributes =
      dto.canonicalAttributes && dto.canonicalAttributes.length > 0
        ? dto.canonicalAttributes
        : this.extractAttributesFromQuestion(question.canonicalAttributes);

    const approved = await prisma.$transaction(async (tx) => {
      const updatedQuestion = await tx.unansweredQuestion.update({
        where: { id: questionId },
        data: {
          status: 'ANSWERED',
          answerText: dto.answerText,
          answeredById: listerId,
          answeredAt: new Date(),
        },
        include: {
          property: { select: { id: true, title: true, slug: true, suburb: true, listerId: true } },
        },
      });

      const approvedAnswer = await tx.approvedAnswer.create({
        data: {
          propertyId: question.propertyId,
          canonicalAttributes,
          answerText: dto.answerText,
          approvedById: listerId,
        },
      });

      if (question.sessionId) {
        const session = await tx.chatSession.findFirst({
          where: { id: question.sessionId, ...notDeleted() },
        });

        if (session) {
          const memory = parseSessionMemory(session.contextMemory);
          const primaryAttribute = canonicalAttributes[0] ?? 'lister_answer';
          const updatedMemory = upsertMemoryFact(memory, {
            attribute: primaryAttribute,
            value: dto.answerText,
            source: 'lister_answer',
            questionId,
          });

          await tx.chatSession.update({
            where: { id: session.id },
            data: { contextMemory: sessionMemoryToJson(updatedMemory) },
          });
        }
      }

      return { updatedQuestion, approvedAnswer };
    });

    return {
      question: this.toSafeQuestion(approved.updatedQuestion),
      approvedAnswerId: approved.approvedAnswer.id,
    };
  }

  private extractAttributesFromQuestion(value: Prisma.JsonValue | null): string[] {
    if (!Array.isArray(value)) {
      return ['general'];
    }

    const attrs: string[] = [];
    for (const item of value) {
      if (typeof item === 'string') {
        attrs.push(item);
      }
    }

    return attrs.length > 0 ? attrs : ['general'];
  }
}

export const listerService = new ListerService();
